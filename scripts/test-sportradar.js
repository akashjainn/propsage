#!/usr/bin/env node

/**
 * Test Sportradar NFL API connectivity - comprehensive test
 * Tests: teams, schedules, current season, and box scores
 * Usage: node scripts/test-sportradar.js
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_KEY = process.env.SPORTRADAR_API_KEY;
const BASE_URL = 'https://api.sportradar.com/nfl/official/trial/v7/en';
const LOCAL_API = 'http://127.0.0.1:4000/nfl/sd'; // Use 127.0.0.1 instead of localhost

if (!API_KEY) {
  console.error('❌ SPORTRADAR_API_KEY not found in .env');
  process.exit(1);
}

console.log('🏈 Testing Sportradar NFL API Integration...');
console.log(`API Key: ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`);
console.log();

async function testSportradarDirect(name, path) {
  const url = `${BASE_URL}/${path}.json?api_key=${API_KEY}`;
  console.log(`📡 Testing Sportradar Direct: ${name}...`);
  
  try {
    const res = await fetch(url);
    const text = await res.text();
    
    if (!res.ok) {
      console.error(`   ❌ HTTP ${res.status}: ${text.slice(0, 150)}`);
      return { success: false, data: null };
    }
    
    const data = JSON.parse(text);
    console.log(`   ✅ Success! Response keys:`, Object.keys(data));
    
    // Show sample data based on endpoint
    if (name.includes('Hierarchy') && data.conferences) {
      const teamCount = data.conferences.reduce((sum, conf) => {
        return sum + conf.divisions.reduce((divSum, div) => divSum + (div.teams?.length || 0), 0);
      }, 0);
      console.log(`   📊 Found ${data.conferences.length} conferences, ${teamCount} teams`);
    }
    
    if (name.includes('Schedule') && data.weeks) {
      const gameCount = data.weeks.reduce((sum, week) => sum + (week.games?.length || 0), 0);
      console.log(`   📊 Found ${data.weeks.length} weeks, ${gameCount} games`);
      if (data.weeks[0]?.games?.[0]) {
        const sampleGame = data.weeks[0].games[0];
        console.log(`   🏈 Sample game: ${sampleGame.away?.alias} @ ${sampleGame.home?.alias}`);
        console.log(`   📅 Scheduled: ${sampleGame.scheduled}, Status: ${sampleGame.status}`);
        // Return first game ID for boxscore test
        if (sampleGame.id) {
          return { success: true, data: { gameId: sampleGame.id, ...data } };
        }
      }
    }
    
    if (name.includes('Boxscore')) {
      console.log(`   🎯 Game ID: ${data.id}`);
      console.log(`   📊 Status: ${data.status}, Quarter: ${data.quarter || 'N/A'}`);
      if (data.summary) {
        console.log(`   🏈 Score: ${data.summary.away?.alias} ${data.summary.away?.points || 0} @ ${data.summary.home?.alias} ${data.summary.home?.points || 0}`);
      }
    }
    
    console.log();
    return { success: true, data };
  } catch (err) {
    console.error(`   ❌ Error:`, err.message);
    console.log();
    return { success: false, data: null };
  }
}

async function testLocalAPI(name, path) {
  const url = `${LOCAL_API}${path}`;
  console.log(`🖥️  Testing Local API: ${name}...`);
  console.log(`   URL: ${url}`);
  
  try {
    const res = await fetch(url);
    const text = await res.text();
    
    if (!res.ok) {
      console.error(`   ❌ HTTP ${res.status}: ${text.slice(0, 150)}`);
      return false;
    }
    
    const data = JSON.parse(text);
    console.log(`   ✅ Success!`);
    
    if (data.teams && Array.isArray(data.teams)) {
      console.log(`   📊 ${data.count || data.teams.length} teams returned`);
    } else if (data.schedule && Array.isArray(data.schedule)) {
      console.log(`   📊 ${data.count || data.schedule.length} games returned`);
    } else if (data.id) {
      console.log(`   🎯 Boxscore for game ${data.id}`);
    }
    
    console.log();
    return true;
  } catch (err) {
    console.error(`   ❌ Error:`, err.message);
    console.log();
    return false;
  }
}

async function main() {
  const currentYear = new Date().getFullYear();
  let gameId = null;
  
  console.log('═'.repeat(60));
  console.log('PART 1: Testing Sportradar API Directly');
  console.log('═'.repeat(60));
  console.log();
  
  const directTests = [
    ['League Hierarchy (Teams)', 'league/hierarchy'],
    ['Current Season Schedule', 'games/current_season/schedule'],
    [`Season Schedule (${currentYear} REG)`, `games/${currentYear}/REG/schedule`],
  ];
  
  let directPassed = 0;
  let directFailed = 0;
  
  for (const [name, path] of directTests) {
    const result = await testSportradarDirect(name, path);
    if (result.success) {
      directPassed++;
      if (result.data?.gameId) {
        gameId = result.data.gameId;
      }
    } else {
      directFailed++;
    }
    await new Promise(resolve => setTimeout(resolve, 1100)); // Rate limit: 1 req/sec
  }
  
  // Test boxscore if we got a game ID
  if (gameId) {
    console.log(`Found game ID: ${gameId}, testing boxscore...`);
    await new Promise(resolve => setTimeout(resolve, 1100));
    const boxscoreResult = await testSportradarDirect('Game Boxscore', `games/${gameId}/boxscore`);
    if (boxscoreResult.success) directPassed++;
    else directFailed++;
  }
  
  console.log('─'.repeat(60));
  console.log(`Direct API Results: ${directPassed} passed, ${directFailed} failed`);
  console.log();
  
  // Test local API endpoints
  console.log('═'.repeat(60));
  console.log('PART 2: Testing Local PropSage API Endpoints');
  console.log('═'.repeat(60));
  console.log();
  
  const localTests = [
    ['Teams', '/teams'],
    ['Current Season Schedule', '/schedule/current'],
    [`Schedule (${currentYear}REG)`, `/schedule?season=${currentYear}REG`],
  ];
  
  if (gameId) {
    localTests.push(['Game Boxscore', `/boxscore/${gameId}`]);
  }
  
  let localPassed = 0;
  let localFailed = 0;
  
  for (const [name, path] of localTests) {
    const result = await testLocalAPI(name, path);
    if (result) localPassed++;
    else localFailed++;
  }
  
  console.log('─'.repeat(60));
  console.log(`Local API Results: ${localPassed} passed, ${localFailed} failed`);
  console.log();
  
  // Final summary
  console.log('═'.repeat(60));
  console.log('FINAL SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Sportradar Direct: ${directPassed}/${directTests.length + (gameId ? 1 : 0)} tests passed`);
  console.log(`PropSage Local API: ${localPassed}/${localTests.length} tests passed`);
  console.log();
  
  if (directFailed === 0 && localFailed === 0) {
    console.log('✅ All tests passed! Sportradar integration is working perfectly.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
    if (localFailed > 0) {
      console.log('💡 Make sure your local API server is running: pnpm dev:api');
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
