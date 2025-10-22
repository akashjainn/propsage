#!/usr/bin/env node
/**
 * Smart Tagging for TwelveLabs Videos
 * - Lists videos from the configured index
 * - Extracts home/away teams from filename (supports NFL & CFB)
 * - Detects league and prepares proper metadata
 * - Skips videos still indexing
 * - Dry-run by default; pass --apply to update metadata
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
// Import from built JS to avoid TS runtime issues
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
const FORCE = args.includes('--force');
const LIMIT = parseInt((args.find(a => a.startsWith('--limit=')) || '').split('=')[1] || '100', 10);

// Build team matchers
const NFL_TEAMS = getTeamsForLeague('nfl');
const CFB_TEAMS = getTeamsForLeague('cfb');
const ALL_TEAMS = [...new Set([...NFL_TEAMS, ...CFB_TEAMS])];
const TEAM_PATTERNS = ALL_TEAMS
  // Sort longer names first to avoid partial matches (e.g., "State" vs "Ohio State")
  .sort((a, b) => b.length - a.length)
  .map(name => ({ name, re: new RegExp(`(?:^|[^A-Za-z])${name.replace(/[-/\\^$*+?.()|[\]{}]/g, r=>`\\${r}`)}(?:[^A-Za-z]|$)`, 'i') }));

function extractTeamsFromFilename(filename) {
  if (!filename) return { teams: [], league: null };
  const hits = [];
  for (const { name, re } of TEAM_PATTERNS) {
    if (re.test(filename)) hits.push(name);
    if (hits.length >= 4) break; // safeguard
  }
  // Normalize & dedupe
  const normalized = [...new Set(hits.map(normalizeTeamName))];

  // Try to pick two distinct teams
  let teams = [];
  for (const t of normalized) {
    if (!teams.includes(t)) teams.push(t);
    if (teams.length === 2) break;
  }

  // If none found, try abbreviations by token
  if (teams.length === 0) {
    const tokens = filename.split(/[^A-Za-z0-9&]+/).filter(Boolean);
    for (const tok of tokens) {
      const mapped = normalizeTeamName(tok);
      if (ALL_TEAMS.includes(mapped) && !teams.includes(mapped)) teams.push(mapped);
      if (teams.length === 2) break;
    }
  }

  // Detect league
  let league = null;
  if (teams.length > 0) {
    const l1 = detectLeague(teams[0]);
    const l2 = teams[1] ? detectLeague(teams[1]) : null;
    if (l1 && l2 && l1 === l2) league = l1;
    else if (l1) league = l1;
    else if (l2) league = l2;
  }

  // Validate team/league consistency
  if (league) {
    teams = teams.filter(t => isValidTeamForLeague(t, league));
  }

  return { teams, league };
}

// Load processed video library (optional aid for matching)
let processedIndex = null;
try {
  const { readFileSync, existsSync } = await import('fs');
  const p = resolve(__dirname, '../../data/video-library-processed.json');
  if (existsSync(p)) {
    const arr = JSON.parse(readFileSync(p, 'utf-8'));
    processedIndex = new Map();
    const simplify = s => s.toLowerCase().replace(/\.[a-z0-9]+$/i,'').replace(/[^a-z0-9]+/g,' ').trim();
    for (const item of arr) {
      const key = simplify(item.filename || '');
      if (key) {
        // Prefer explicit teams field if present; else extract from filename
        const parsed = extractTeamsFromFilename(item.filename || '');
        processedIndex.set(key, {
          filename: item.filename,
          teamsHint: parsed.teams,
          leagueHint: parsed.league
        });
      }
    }
    console.log(`🔎 Loaded processed library index: ${processedIndex.size} items`);
  }
} catch {}

function simplifyName(s) {
  return (s || '').toLowerCase().replace(/\.[a-z0-9]+$/i,'').replace(/[^a-z0-9]+/g,' ').trim();
}

function enrichFromProcessed(nameCandidates) {
  if (!processedIndex) return null;
  for (const cand of nameCandidates) {
    const simple = simplifyName(cand);
    if (!simple) continue;
    // Exact or substring match
    for (const [key, val] of processedIndex.entries()) {
      if (simple.includes(key) || key.includes(simple)) {
        return val;
      }
    }
  }
  return null;
}

async function listVideos(page = 1, page_limit = 50) {
  const url = `${BASE_V13}/indexes/${INDEX_ID}/videos?page=${page}&page_limit=${page_limit}`;
  const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List videos failed: ${res.status} - ${text}`);
  }
  return res.json();
}

async function getVideoDetails(videoId) {
  const url = `${BASE_V13}/indexes/${INDEX_ID}/videos/${videoId}`;
  const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
  if (!res.ok) return null;
  return res.json();
}

async function updateVideoMetadata(videoId, metadata) {
  const url = `${BASE_V13}/indexes/${INDEX_ID}/videos/${videoId}`;
  // Try PATCH (preferred)
  let res = await fetch(url, {
    method: 'PATCH',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata })
  });
  if (res.ok) return res.json();
  const err1 = await res.text();

  // Fallback to PUT
  res = await fetch(url, {
    method: 'PUT',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata })
  });
  if (res.ok) return res.json();
  const err2 = await res.text();

  throw new Error(`Update failed (PATCH: ${err1}) (PUT: ${err2})`);
}

function pickSeasonAndWeek(league) {
  const season = String(new Date().getFullYear());
  const week = league === 'nfl' ? 5 : undefined; // Could be inferred later
  return { season, week };
}

async function main() {
  console.log(`🧠 Smart Tagging (dry-run=${!APPLY}, limit=${LIMIT})`);
  console.log(`Index: ${INDEX_ID}`);

  let page = 1;
  let totalProcessed = 0;
  let tagged = 0;
  let skipped = 0;
  let indexing = 0;
  let errors = 0;

  while (totalProcessed < LIMIT) {
    const data = await listVideos(page, Math.min(50, LIMIT - totalProcessed));
    const items = data.data || [];
    if (items.length === 0) break;

    for (const v of items) {
      totalProcessed++;
      const detail = await getVideoDetails(v._id).catch(() => null);
      const filename = v.metadata?.filename || v.title || detail?.metadata?.filename || detail?.title || v._id;
      const candidates = [filename, detail?.metadata?.filename, detail?.title].filter(Boolean);
      const hints = enrichFromProcessed(candidates);

      const parsed = extractTeamsFromFilename(filename);
      const teams = hints?.teamsHint?.length ? hints.teamsHint : parsed.teams;
      const league = hints?.leagueHint || parsed.league;
      const metaPreview = { league, teams, name: filename };

      // Ready check: if detail has any ready indicators; otherwise assume ready if FORCE
      const isReady = FORCE || !!detail || !!v.indexed_at;
      if (!isReady && !FORCE) {
        console.log(`⏳ [indexing] ${filename} ->`, metaPreview);
        indexing++;
        continue;
      }

      if (!league || teams.length === 0) {
        console.log(`⏭️  [skip:no-teams] ${filename} ->`, metaPreview);
        skipped++;
        continue;
      }

      const { season, week } = pickSeasonAndWeek(league);
      const newMetadata = {
        ...(v.metadata || {}),
        league: league.toUpperCase(),
        team: teams[0],
        ...(teams[1] ? { opponent: teams[1] } : {}),
        season,
        ...(week ? { week } : {})
      };

  console.log(`${APPLY ? '✍️ ' : '🔎'} [${league || 'unknown'}] ${filename} ->`, newMetadata);

      if (APPLY) {
        try {
          await updateVideoMetadata(v._id, newMetadata);
          tagged++;
          // brief delay for rate limiting
          await new Promise(r => setTimeout(r, 150));
        } catch (e) {
          console.error(`❌ update failed: ${e.message}`);
          errors++;
        }
      }

      if (totalProcessed >= LIMIT) break;
    }

    if (items.length < 50) break; // no more pages
    page++;
  }

  console.log('\n═'.repeat(50));
  console.log('📊 Summary');
  console.log(`Processed: ${totalProcessed}`);
  console.log(`Ready and tagged: ${tagged}${APPLY ? '' : ' (dry-run)'}`);
  console.log(`Skipped (no teams/league): ${skipped}`);
  console.log(`Still indexing: ${indexing}`);
  console.log(`Errors: ${errors}`);
  console.log('═'.repeat(50));

  console.log('\nRun with --apply to update metadata.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
