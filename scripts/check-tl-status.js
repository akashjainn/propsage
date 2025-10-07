#!/usr/bin/env node
/**
 * Check TwelveLabs indexing status and test search functionality
 * Usage: node scripts/check-tl-status.js [--health] [--search "query"]
 */

import { config } from 'dotenv';
import { twelveLabsClient } from '../apps/api/dist/services/twelve-labs-client.js';
import fs from 'fs';

// Load environment
config();

async function checkHealth() {
  console.log('🏥 TwelveLabs Health Check\n');
  
  const health = await twelveLabsClient.healthCheck();
  console.log(`Status: ${health.status === 'ok' ? '✅' : '❌'} ${health.details}`);
  
  if (health.status === 'ok') {
    console.log('✅ TwelveLabs API is accessible');
  } else {
    console.log('❌ TwelveLabs API issues detected');
    console.log('   Check your TL_API_KEY and TWELVELABS_INDEX_ID');
  }
  
  return health.status === 'ok';
}

async function checkIndexingStatus() {
  console.log('📊 Indexing Status Check\n');
  
  const statusFile = './indexing-tasks.json';
  
  if (!fs.existsSync(statusFile)) {
    console.log('⚠️  No indexing tasks file found.');
    console.log('   Run: node scripts/index-videos.js to start indexing');
    return;
  }
  
  const tasks = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
  console.log(`📋 Found ${tasks.length} indexing tasks to check\n`);
  
  const summary = {
    ready: 0,
    indexing: 0,
    failed: 0
  };
  
  for (const task of tasks) {
    try {
      const status = await twelveLabsClient.getIndexingStatus(task.taskId);
      
      const emoji = status === 'ready' ? '✅' : 
                   status === 'failed' ? '❌' : '🔄';
      
      console.log(`${emoji} ${task.filename}`);
      console.log(`   Task: ${task.taskId}`);
      console.log(`   Video: ${task.videoId}`);
      console.log(`   Status: ${status}`);
      console.log();
      
      summary[status]++;
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`❌ ${task.filename}: Error checking status`);
      console.log(`   ${error.message}`);
      summary.failed++;
    }
  }
  
  console.log('📈 Summary:');
  console.log(`   ✅ Ready: ${summary.ready}`);
  console.log(`   🔄 Indexing: ${summary.indexing}`);
  console.log(`   ❌ Failed: ${summary.failed}`);
  
  const totalProcessed = summary.ready + summary.failed;
  const successRate = totalProcessed > 0 ? Math.round((summary.ready / totalProcessed) * 100) : 0;
  console.log(`   📊 Success Rate: ${successRate}%`);
  
  if (summary.indexing > 0) {
    console.log('\n⏳ Indexing still in progress. Check again later.');
  }
  
  return summary;
}

async function testSearch(query = 'touchdown') {
  console.log(`🔍 Testing Search: "${query}"\n`);
  
  try {
    const results = await twelveLabsClient.searchMoments([query], undefined, 5);
    
    if (results.length === 0) {
      console.log('⚠️  No search results found');
      console.log('   This could mean:');
      console.log('   1. No videos are indexed yet');
      console.log('   2. The query doesn\'t match any content');
      console.log('   3. Videos are still being processed');
    } else {
      console.log(`✅ Found ${results.length} results:`);
      console.log();
      
      results.forEach((result, i) => {
        console.log(`${i + 1}. ${result.label}`);
        console.log(`   Video: ${result.videoId}`);
        console.log(`   Time: ${result.startTime}s - ${result.endTime}s`);
        console.log(`   Score: ${Math.round(result.score * 100)}%`);
        console.log(`   Confidence: ${result.confidence}`);
        console.log();
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Search test failed:', error.message);
    return [];
  }
}

async function generateTestQueries() {
  const queries = [
    'touchdown',
    'passing play', 
    'running back',
    'field goal',
    'interception',
    'quarterback',
    'wide receiver',
    'Alabama football',
    'Georgia highlights'
  ];
  
  console.log('🧪 Testing Multiple Queries\n');
  
  const results = {};
  
  for (const query of queries) {
    console.log(`Testing: "${query}"`);
    
    try {
      const moments = await twelveLabsClient.searchMoments([query], undefined, 3);
      results[query] = moments.length;
      
      console.log(`   Results: ${moments.length}`);
      
      if (moments.length > 0) {
        const avgScore = Math.round((moments.reduce((sum, m) => sum + m.score, 0) / moments.length) * 100);
        console.log(`   Avg Score: ${avgScore}%`);
      }
      
    } catch (error) {
      console.log(`   Error: ${error.message}`);
      results[query] = 0;
    }
    
    console.log();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('📊 Query Test Summary:');
  Object.entries(results).forEach(([query, count]) => {
    console.log(`   "${query}": ${count} results`);
  });
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  
  console.log('🏈 PropSage TwelveLabs Status Check\n');
  
  // Always check health first
  const healthOk = await checkHealth();
  console.log();
  
  if (!healthOk) {
    console.log('❌ Health check failed. Fix configuration before continuing.');
    process.exit(1);
  }
  
  if (args.includes('--health')) {
    console.log('✅ Health check complete');
    return;
  }
  
  const searchQuery = args.find(arg => arg.startsWith('--search'));
  if (searchQuery) {
    const query = searchQuery.split('=')[1] || 'touchdown';
    await testSearch(query);
    return;
  }
  
  if (args.includes('--test-queries')) {
    await generateTestQueries();
    return;
  }
  
  // Default: check indexing status
  await checkIndexingStatus();
  
  console.log('\n🔧 Available Commands:');
  console.log('   --health              : Health check only');
  console.log('   --search="query"      : Test search with specific query');
  console.log('   --test-queries        : Test multiple common queries');
  console.log('\n💡 Tips:');
  console.log('   Run indexing: node scripts/index-videos.js');
  console.log('   Test search:  node scripts/check-tl-status.js --search="touchdown"');
}

main().catch(console.error);