#!/usr/bin/env node
/**
 * Tag TL videos by matching processed filenames via search
 * - Uses local data/video-library-processed.json
 * - For each filename, extracts teams/league
 * - Searches TL with a query built from team names + league keywords
 * - Picks the most frequent video_id from search results
 * - Updates that video's metadata accordingly
 *
 * Usage:
 *  node apps/api/tag-videos-from-filenames.js --limit=50         # dry-run
 *  node apps/api/tag-videos-from-filenames.js --apply --limit=50  # apply updates
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import {
  detectLeague,
  normalizeTeamName,
  isValidTeamForLeague,
  getTeamsForLeague
} from './dist/services/league-context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const API_KEY = process.env.TWELVELABS_API_KEY || process.env.TL_API_KEY;
const INDEX_ID = process.env.TWELVELABS_INDEX_ID;
const BASE_V13 = process.env.TWELVELABS_BASE_URL || 'https://api.twelvelabs.io/v1.3';

if (!API_KEY || !INDEX_ID) {
  console.error('❌ Missing TWELVELABS_API_KEY or TWELVELABS_INDEX_ID');
  process.exit(1);
}

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const LIMIT = parseInt((args.find(a => a.startsWith('--limit=')) || '').split('=')[1] || '100', 10);
const MIN_HITS = parseInt((args.find(a => a.startsWith('--minHits=')) || '').split('=')[1] || '3', 10);

function loadProcessed() {
  const p = resolve(__dirname, '../../data/video-library-processed.json');
  if (!existsSync(p)) {
    console.error('❌ Missing data/video-library-processed.json');
    process.exit(1);
  }
  return JSON.parse(readFileSync(p, 'utf-8'));
}

const NFL_TEAMS = new Set(getTeamsForLeague('nfl'));
const CFB_TEAMS = new Set(getTeamsForLeague('cfb'));

function extractTeams(filename) {
  const base = filename.replace(/\.[a-z0-9]+$/i,'');
  const tokens = base.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const words = base.split(/[^A-Za-z]+/);

  // League hint from filename
  let leagueHint = null;
  if (/\bnfl\b/i.test(base)) leagueHint = 'nfl';
  else if (/\b(cfb|college|ncaa)\b/i.test(base)) leagueHint = 'cfb';

  // Try multi-word team names by scanning all possible substrings up to 3 words
  const candidates = new Set();
  for (let i=0;i<words.length;i++) {
    for (let j=i+1;j<=Math.min(words.length,i+3);j++) {
      const phrase = words.slice(i,j).join(' ');
      const norm = normalizeTeamName(phrase);
      if (NFL_TEAMS.has(norm) || CFB_TEAMS.has(norm)) {
        candidates.add(norm);
      }
    }
  }
  let teams = Array.from(candidates);
  // If league hint exists, prefer teams of that league
  if (leagueHint) {
    teams = teams.filter(t => leagueHint === 'nfl' ? NFL_TEAMS.has(t) : CFB_TEAMS.has(t));
  }
  teams = teams.slice(0,2);
  let league = null;
  if (teams.length>0) {
    const l1 = detectLeague(teams[0]);
    const l2 = teams[1] ? detectLeague(teams[1]) : null;
    league = leagueHint || l1 || l2;
  }
  return { teams, league };
}

function extractSeasonWeek(filename) {
  const base = filename.replace(/\.[a-z0-9]+$/i,'');
  // Season: 4-digit year, prefer the one near 'Season' keyword
  let season = null;
  const seasonMatch = base.match(/(\d{4})\s*(?:nfl|cfb)?\s*season/i);
  if (seasonMatch) {
    season = seasonMatch[1];
  } else {
    const yearMatch = base.match(/\b(20\d{2})\b/);
    if (yearMatch) season = yearMatch[1];
  }

  // Week: "Week 5" patterns
  let week = null;
  const weekMatch = base.match(/\bweek\s*(\d{1,2})\b/i);
  if (weekMatch) week = parseInt(weekMatch[1], 10);

  return { season, week };
}

async function tlSearch(queryText, limit=10) {
  const form = new FormData();
  form.append('query_text', queryText);
  form.append('index_id', INDEX_ID);
  form.append('search_options', 'visual');
  form.append('search_options', 'audio');
  form.append('sort_option', 'score');
  form.append('page_limit', String(Math.min(limit, 5)));

  const res = await fetch(`${BASE_V13}/search`, { method: 'POST', headers: { 'x-api-key': API_KEY }, body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Search failed: ${res.status} - ${text}`);
  }
  const data = await res.json();
  return data.data || [];
}

async function updateVideoMetadata(videoId, metadata) {
  const url = `${BASE_V13}/indexes/${INDEX_ID}/videos/${videoId}`;
  // Prefer PATCH
  let res = await fetch(url, { method: 'PATCH', headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ metadata }) });
  if (res.ok) return res.json();
  const e1 = await res.text();
  // Fallback PUT
  res = await fetch(url, { method: 'PUT', headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ metadata }) });
  if (res.ok) return res.json();
  const e2 = await res.text();
  throw new Error(`Update failed: PATCH(${e1}) PUT(${e2})`);
}

function buildQuery(teams, league) {
  const parts = [];
  if (league === 'nfl') { parts.push('NFL'); } else if (league === 'cfb') { parts.push('College Football NCAA'); }
  parts.push(...teams);
  parts.push('highlights');
  return parts.join(' ');
}

async function main() {
  console.log(`🧠 Tag by filename via search (dry-run=${!APPLY}, limit=${LIMIT}, minHits=${MIN_HITS})`);
  const items = loadProcessed().slice(0, LIMIT);

  let tagged=0, skipped=0, errors=0;

  for (const item of items) {
    const filename = item.filename || '';
  const { teams, league } = extractTeams(filename);
  const { season, week } = extractSeasonWeek(filename);

    if (!league || teams.length===0) {
      console.log(`⏭️  [skip:no-teams] ${filename}`);
      skipped++;
      continue;
    }

    const query = buildQuery(teams, league);
    let results=[];
    try {
      results = await tlSearch(query, 10);
    } catch (e) {
      console.log(`❌ search error: ${e.message}`);
      errors++;
      continue;
    }

    if (results.length===0) {
      console.log(`⏭️  [no-results] ${filename} → query="${query}"`);
      skipped++;
      continue;
    }

    // Pick the most frequent video_id among top results
    const counts = new Map();
    for (const r of results) counts.set(r.video_id, (counts.get(r.video_id)||0)+1);
    const [bestId, hits] = Array.from(counts.entries()).sort((a,b)=>b[1]-a[1])[0];

    if (hits < MIN_HITS) {
      console.log(`⏭️  [low-confidence:${hits}] ${filename} → best=${bestId}, query="${query}"`);
      skipped++;
      continue;
    }

    const metadata = { 
      league: league.toUpperCase(), 
      team: teams[0], 
      ...(teams[1]?{opponent: teams[1]}:{}), 
      ...(season?{season}:{}), 
      ...(week?{week}:{}), 
      filename 
    };

    console.log(`${APPLY?'✍️':'🔎'} [${league}] ${filename} → video ${bestId} (${hits} hits)`, metadata);

    if (APPLY) {
      try {
        await updateVideoMetadata(bestId, metadata);
        tagged++;
        await new Promise(r=>setTimeout(r,150));
      } catch(e) {
        console.log(`❌ update error: ${e.message}`);
        errors++;
      }
    }
  }

  console.log('\n═'.repeat(50));
  console.log('📊 Summary');
  console.log(`Tagged: ${tagged}${APPLY?'':' (dry-run)'}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('═'.repeat(50));
}

main().catch(e=>{ console.error('Fatal:', e.message); process.exit(1); });
