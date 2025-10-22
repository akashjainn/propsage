#!/usr/bin/env node
/**
 * Video Issue Diagnostic Script
 * 
 * Checks why videos aren't playing:
 * 1. TwelveLabs index status
 * 2. Video count and metadata
 * 3. Search functionality
 * 4. API endpoint responses
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
dotenv.config({ path: resolve(__dirname, '../../.env') });

console.log('🔍 PropSage Video Diagnostic\n');
console.log('═'.repeat(60));

// Step 1: Environment Check
console.log('\n📋 Step 1: Environment Variables');
console.log('─'.repeat(60));

const env = {
  DEMO_MODE: process.env.DEMO_MODE,
  TWELVELABS_API_KEY: process.env.TWELVELABS_API_KEY || process.env.TL_API_KEY,
  TWELVELABS_INDEX_ID: process.env.TWELVELABS_INDEX_ID,
  TL_INDEX_NFL: process.env.TL_INDEX_NFL,
  TL_INDEX_CFB: process.env.TL_INDEX_CFB,
  VIDEO_ENABLED: process.env.VIDEO_ENABLED
};

Object.entries(env).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const display = value ? (key.includes('KEY') ? '***' + value.slice(-4) : value) : 'NOT SET';
  console.log(`  ${status} ${key}: ${display}`);
});

const hasApiKey = !!env.TWELVELABS_API_KEY;
const hasIndexId = !!(env.TWELVELABS_INDEX_ID || env.TL_INDEX_NFL);
const isDemoMode = env.DEMO_MODE === 'true';

console.log('\n📊 Configuration Status:');
if (isDemoMode) {
  console.log('  ⚠️  Running in DEMO MODE - using mock data');
  console.log('  ℹ️  TwelveLabs integration disabled in demo mode');
} else if (!hasApiKey) {
  console.log('  ❌ Missing TWELVELABS_API_KEY - cannot connect to TL');
} else if (!hasIndexId) {
  console.log('  ❌ Missing TWELVELABS_INDEX_ID - no index configured');
  console.log('  💡 Run: pnpm tl:setup');
} else {
  console.log('  ✅ TwelveLabs configured correctly');
}

// Step 2: TwelveLabs Index Check
if (hasApiKey && hasIndexId) {
  console.log('\n📹 Step 2: TwelveLabs Index Status');
  console.log('─'.repeat(60));
  
  const indexId = env.TWELVELABS_INDEX_ID || env.TL_INDEX_NFL;
  
  try {
    const response = await fetch(`https://api.twelvelabs.io/v1.3/indexes/${indexId}`, {
      headers: {
        'x-api-key': env.TWELVELABS_API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Index found: ${data._id}`);
      console.log(`  📛 Name: ${data.index_name}`);
      console.log(`  🔧 Engines: ${data.engines?.map(e => e.name).join(', ')}`);
      
      // Check for videos
      const videosResponse = await fetch(`https://api.twelvelabs.io/v1.3/indexes/${indexId}/videos?page=1&page_limit=10`, {
        headers: {
          'x-api-key': env.TWELVELABS_API_KEY
        }
      });
      
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        const totalVideos = videosData.page_info?.total_results || 0;
        console.log(`  📊 Total videos: ${totalVideos}`);
        
        if (totalVideos === 0) {
          console.log('\n  ⚠️  NO VIDEOS INDEXED YET!');
          console.log('  💡 This is why clips array is empty');
          console.log('  💡 Run: pnpm tl:index (to index videos)');
        } else {
          console.log('\n  📝 Sample videos:');
          videosData.data?.slice(0, 3).forEach((video, i) => {
            console.log(`    ${i + 1}. ${video.metadata?.filename || video._id}`);
            console.log(`       Status: ${video.indexed_at ? 'Ready' : 'Indexing...'}`);
            console.log(`       Duration: ${video.metadata?.duration || 'unknown'}s`);
            
            // Check metadata
            if (video.metadata) {
              const hasLeague = video.metadata.league;
              const hasTeam = video.metadata.team || video.metadata.game_id;
              console.log(`       League tag: ${hasLeague ? '✅ ' + video.metadata.league : '❌ Missing'}`);
              console.log(`       Team tag: ${hasTeam ? '✅' : '❌ Missing'}`);
              
              if (!hasLeague || !hasTeam) {
                console.log('       ⚠️  Missing league/team metadata - won\'t appear in searches!');
              }
            } else {
              console.log('       ⚠️  No metadata - won\'t appear in league-aware searches!');
            }
          });
        }
      }
    } else {
      const errorText = await response.text();
      console.log(`  ❌ Index not accessible: ${response.status}`);
      console.log(`  Error: ${errorText}`);
      if (response.status === 404) {
        console.log('\n  💡 Index ID not found - run: pnpm tl:setup');
      }
    }
  } catch (error) {
    console.log(`  ❌ Error connecting to TwelveLabs: ${error.message}`);
  }
}

// Step 3: Test Search
if (hasApiKey && hasIndexId) {
  console.log('\n🔍 Step 3: Test TwelveLabs Search');
  console.log('─'.repeat(60));
  
  const indexId = env.TWELVELABS_INDEX_ID || env.TL_INDEX_NFL;
  
  try {
    const formData = new FormData();
    formData.append('query_text', 'NFL Ravens Lamar Jackson rushing touchdown');
    formData.append('index_id', indexId);
    formData.append('search_options', 'visual');
    formData.append('search_options', 'audio');
    formData.append('sort_option', 'score');
    formData.append('page_limit', '5');
    
    const response = await fetch('https://api.twelvelabs.io/v1.3/search', {
      method: 'POST',
      headers: {
        'x-api-key': env.TWELVELABS_API_KEY
      },
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Search successful`);
      console.log(`  📊 Results: ${data.data?.length || 0} clips found`);
      
      if (data.data && data.data.length > 0) {
        console.log('\n  📝 Top results:');
        data.data.forEach((result, i) => {
          console.log(`    ${i + 1}. Video ${result.video_id}`);
          console.log(`       Score: ${result.score.toFixed(2)}`);
          console.log(`       Time: ${result.start}s - ${result.end}s`);
          console.log(`       Confidence: ${result.confidence || 'N/A'}`);
        });
      } else {
        console.log('\n  ⚠️  No results found for "NFL Ravens Lamar Jackson"');
        console.log('  Possible reasons:');
        console.log('    1. Videos not indexed with proper metadata');
        console.log('    2. No NFL/Ravens/Lamar Jackson content in index');
        console.log('    3. Metadata missing league/team tags');
      }
    } else {
      const errorText = await response.text();
      console.log(`  ❌ Search failed: ${response.status}`);
      console.log(`  Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`  ❌ Error during search: ${error.message}`);
  }
}

// Step 4: Demo Mode Data Check
if (isDemoMode) {
  console.log('\n📦 Step 4: Demo Mode Data Check');
  console.log('─'.repeat(60));
  
  try {
    const { readFileSync, existsSync } = await import('fs');
    const demoDataPath = resolve(__dirname, '../data');
    
    console.log(`  📁 Demo data directory: ${demoDataPath}`);
    
    const files = ['clips.demo.json', 'clips.haynes.json', 'games.demo.json'];
    files.forEach(file => {
      const fullPath = resolve(demoDataPath, file);
      const exists = existsSync(fullPath);
      console.log(`  ${exists ? '✅' : '❌'} ${file}`);
      
      if (exists) {
        try {
          const content = JSON.parse(readFileSync(fullPath, 'utf-8'));
          const count = Array.isArray(content) ? content.length : Object.keys(content).length;
          console.log(`     ${count} entries`);
        } catch (e) {
          console.log(`     ⚠️  Could not parse JSON`);
        }
      }
    });
  } catch (error) {
    console.log(`  ⚠️  Could not read demo data: ${error.message}`);
  }
}

// Step 5: API Endpoint Test
console.log('\n🌐 Step 5: API Endpoint Test');
console.log('─'.repeat(60));

const apiBase = process.env.API_URL || 'http://localhost:4000';
console.log(`  Testing: ${apiBase}`);

try {
  // Test health endpoint
  const healthUrl = `${apiBase}/nfl/evidence/health`;
  console.log(`\n  Testing: GET ${healthUrl}`);
  
  const response = await fetch(healthUrl);
  if (response.ok) {
    const data = await response.json();
    console.log(`  ✅ API responding: ${data.status}`);
    console.log(`  TwelveLabs: ${data.twelvelabs}`);
    console.log(`  Test query: ${data.testQuery}`);
  } else {
    console.log(`  ❌ API returned ${response.status}`);
  }
} catch (error) {
  console.log(`  ❌ Cannot reach API: ${error.message}`);
  console.log(`  💡 Make sure API is running: pnpm dev:api`);
}

// Summary
console.log('\n═'.repeat(60));
console.log('📋 DIAGNOSIS SUMMARY');
console.log('═'.repeat(60));

if (isDemoMode) {
  console.log('\n✅ System is in DEMO MODE');
  console.log('   Videos come from data/*.json files');
  console.log('   TwelveLabs integration is disabled');
} else if (!hasApiKey) {
  console.log('\n❌ PROBLEM: Missing TWELVELABS_API_KEY');
  console.log('   SOLUTION:');
  console.log('   1. Get API key from https://twelvelabs.io/');
  console.log('   2. Add to .env: TWELVELABS_API_KEY=tlk_...');
} else if (!hasIndexId) {
  console.log('\n❌ PROBLEM: Missing TWELVELABS_INDEX_ID');
  console.log('   SOLUTION:');
  console.log('   1. Run: pnpm tl:setup');
  console.log('   2. Copy the index ID to .env');
} else {
  console.log('\n✅ TwelveLabs configured');
  console.log('   Next steps:');
  console.log('   1. If no videos indexed: pnpm tl:index');
  console.log('   2. Ensure videos have league metadata');
  console.log('   3. Test with: curl "http://localhost:4000/nfl/evidence/player/Lamar%20Jackson?team=Ravens"');
}

console.log('\n📖 See docs/TWELVELABS_SETUP.md for detailed setup');
console.log('📖 See apps/api/LEAGUE_AWARE_EVIDENCE.md for metadata requirements');
console.log('\n');
