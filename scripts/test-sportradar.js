#!/usr/bin/env node

/**
 * Test Sportradar NFL API connectivity
 * Usage: node scripts/test-sportradar.js
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_KEY = process.env.SPORTRADAR_API_KEY;
const BASE_URL = 'https://api.sportradar.com/nfl/official/trial/v7/en';

if (!API_KEY) {
  console.error('❌ SPORTRADAR_API_KEY not found in .env');
  process.exit(1);
}

console.log('🏈 Testing Sportradar NFL API...');
console.log(`API Key: ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`);
console.log();

async function testEndpoint(name, path) {
  const url = `${BASE_URL}/${path}.json?api_key=${API_KEY}`;
  console.log(`Testing ${name}...`);
  console.log(`URL: ${url.replace(API_KEY, 'API_KEY')}`);
  
  try {
    const res = await fetch(url);
    const text = await res.text();
    
    if (!res.ok) {
      console.error(`❌ HTTP ${res.status}: ${text.slice(0, 200)}`);
      return false;
    }
    
    const data = JSON.parse(text);
    console.log(`✅ Success! Response keys:`, Object.keys(data));
    
    // Show sample data based on endpoint
    if (name === 'League Hierarchy' && data.conferences) {
      const teamCount = data.conferences.reduce((sum, conf) => {
        return sum + conf.divisions.reduce((divSum, div) => divSum + (div.teams?.length || 0), 0);
      }, 0);
      console.log(`   📊 Found ${data.conferences.length} conferences, ${teamCount} teams`);
      if (data.conferences[0]?.divisions?.[0]?.teams?.[0]) {
        const sampleTeam = data.conferences[0].divisions[0].teams[0];
        console.log(`   🏈 Sample team: ${sampleTeam.market} ${sampleTeam.name} (${sampleTeam.alias})`);
      }
    }
    
    if (name === 'Season Schedule' && data.weeks) {
      const gameCount = data.weeks.reduce((sum, week) => sum + (week.games?.length || 0), 0);
      console.log(`   📊 Found ${data.weeks.length} weeks, ${gameCount} games`);
      if (data.weeks[0]?.games?.[0]) {
        const sampleGame = data.weeks[0].games[0];
        console.log(`   🏈 Sample game: ${sampleGame.away?.alias} @ ${sampleGame.home?.alias}`);
        console.log(`      Status: ${sampleGame.status}, Scheduled: ${sampleGame.scheduled}`);
      }
    }
    
    console.log();
    return true;
  } catch (err) {
    console.error(`❌ Error:`, err.message);
    console.log();
    return false;
  }
}

async function main() {
  const currentYear = new Date().getFullYear();
  
  const tests = [
    ['League Hierarchy', 'league/hierarchy'],
    ['Season Schedule (2025 REG)', `games/${currentYear}/REG/schedule`],
    ['Season Schedule (2024 REG)', `games/2024/REG/schedule`],
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, path] of tests) {
    const result = await testEndpoint(name, path);
    if (result) passed++;
    else failed++;
  }
  
  console.log('━'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All tests passed! Sportradar API is working.');
  } else {
    console.log('❌ Some tests failed. Check API key or subscription level.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
