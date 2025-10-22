#!/usr/bin/env node
/**
 * QUICK FIX: Tag all videos as NFL Ravens (for testing)
 * 
 * This is a temporary solution to get videos showing up immediately.
 * Run tag-videos.js later for proper team detection.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const API_KEY = process.env.TWELVELABS_API_KEY || process.env.TL_API_KEY;
const INDEX_ID = process.env.TWELVELABS_INDEX_ID;

if (!API_KEY || !INDEX_ID) {
  console.error('❌ Missing TWELVELABS_API_KEY or TWELVELABS_INDEX_ID');
  process.exit(1);
}

console.log('⚡ Quick Fix: Tagging all videos as NFL Ravens...\n');

async function listVideos() {
  const response = await fetch(
    `https://api.twelvelabs.io/v1.2/indexes/${INDEX_ID}/videos?page=1&page_limit=100`,
    {
      headers: { 'x-api-key': API_KEY }
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list videos: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.data || [];
}

async function updateVideoMetadata(videoId, metadata) {
  const response = await fetch(
    `https://api.twelvelabs.io/v1.2/indexes/${INDEX_ID}/videos/${videoId}`,
    {
      method: 'PATCH',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ metadata })
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update (${response.status}): ${error}`);
  }
}

async function main() {
  const videos = await listVideos();
  console.log(`Found ${videos.length} videos\n`);
  
  let tagged = 0;
  
  for (const video of videos) {
    try {
      const metadata = {
        league: 'NFL',
        team: 'Ravens',
        season: '2024',
        week: 5,
        player: 'Lamar Jackson'
      };
      
      await updateVideoMetadata(video._id, metadata);
      console.log(`✅ Tagged ${video._id}`);
      tagged++;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ ${video._id}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Tagged ${tagged}/${videos.length} videos`);
  console.log('\n💡 Test now: curl "http://localhost:4000/nfl/evidence/player/Lamar%20Jackson?team=Ravens&week=5"');
}

main().catch(console.error);
