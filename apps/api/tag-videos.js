#!/usr/bin/env node
/**
 * Tag Existing TwelveLabs Videos with League Metadata
 * 
 * This script adds league/team/player metadata to existing videos
 * so they appear in league-aware searches.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { detectLeague, normalizeTeamName } from '../src/services/league-context.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const API_KEY = process.env.TWELVELABS_API_KEY || process.env.TL_API_KEY;
const INDEX_ID = process.env.TWELVELABS_INDEX_ID;

if (!API_KEY || !INDEX_ID) {
  console.error('❌ Missing TWELVELABS_API_KEY or TWELVELABS_INDEX_ID');
  process.exit(1);
}

console.log('🏷️  TwelveLabs Video Tagger\n');

// Helper to extract team from filename
function extractTeam(filename) {
  const teamPatterns = [
    /ravens/i, /chiefs/i, /49ers/i, /cowboys/i, /packers/i,
    /georgia/i, /alabama/i, /ohio\s*state/i, /michigan/i, /clemson/i
  ];
  
  for (const pattern of teamPatterns) {
    const match = filename.match(pattern);
    if (match) {
      return normalizeTeamName(match[0]);
    }
  }
  
  return null;
}

// Helper to extract player from filename
function extractPlayer(filename) {
  const playerPatterns = [
    /lamar\s*jackson/i, /patrick\s*mahomes/i, /josh\s*allen/i,
    /carson\s*beck/i, /caleb\s*williams/i
  ];
  
  for (const pattern of playerPatterns) {
    const match = filename.match(pattern);
    if (match) {
      return match[0].split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }
  
  return null;
}

async function listVideos() {
  const response = await fetch(
    `https://api.twelvelabs.io/v1.3/indexes/${INDEX_ID}/videos?page_limit=100`,
    {
      headers: { 'x-api-key': API_KEY }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to list videos: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data || [];
}

async function updateVideoMetadata(videoId, metadata) {
  const response = await fetch(
    `https://api.twelvelabs.io/v1.3/indexes/${INDEX_ID}/videos/${videoId}`,
    {
      method: 'PUT',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ metadata })
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update video ${videoId}: ${error}`);
  }
  
  return response.json();
}

async function main() {
  console.log('📋 Fetching videos from index...\n');
  
  const videos = await listVideos();
  console.log(`Found ${videos.length} videos\n`);
  
  if (videos.length === 0) {
    console.log('No videos to tag. Index videos first with: pnpm tl:index');
    return;
  }
  
  let tagged = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const video of videos) {
    const videoId = video._id;
    const filename = video.metadata?.filename || videoId;
    
    // Check if already has metadata
    if (video.metadata?.league && video.metadata?.team) {
      console.log(`⏭️  ${filename} - Already tagged`);
      skipped++;
      continue;
    }
    
    // Extract metadata from filename
    const team = extractTeam(filename);
    const player = extractPlayer(filename);
    
    if (!team) {
      console.log(`⚠️  ${filename} - Cannot detect team, skipping`);
      skipped++;
      continue;
    }
    
    const league = detectLeague(team);
    if (!league) {
      console.log(`⚠️  ${filename} - Cannot detect league for team "${team}", skipping`);
      skipped++;
      continue;
    }
    
    // Build metadata
    const metadata = {
      ...video.metadata,
      league: league.toUpperCase(),
      team: normalizeTeamName(team),
      season: '2024',
      ...(league === 'nfl' && { week: 5 }),
      ...(player && { player })
    };
    
    try {
      await updateVideoMetadata(videoId, metadata);
      console.log(`✅ ${filename}`);
      console.log(`   League: ${metadata.league}, Team: ${metadata.team}${player ? `, Player: ${player}` : ''}`);
      tagged++;
      
      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ ${filename} - ${error.message}`);
      errors++;
    }
  }
  
  console.log('\n═'.repeat(40));
  console.log('📊 Summary:');
  console.log(`   ✅ Tagged: ${tagged}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('═'.repeat(40));
  
  if (tagged > 0) {
    console.log('\n🎉 Videos tagged successfully!');
    console.log('💡 Now test: curl "http://localhost:4000/nfl/evidence/player/Lamar%20Jackson?team=Ravens"');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
