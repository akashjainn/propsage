#!/usr/bin/env node

/**
 * Test script for TwelveLabs Mock Service
 * This verifies our mock integration is working correctly
 */

import { twelveLabsMockService } from './apps/api/src/services/twelve-labs-mock.ts';
import { config } from 'dotenv';

// Load environment
config();

async function testMockService() {
  console.log('🧪 Testing TwelveLabs Mock Service');
  console.log('=====================================');
  
  try {
    // Test 1: Health Check
    console.log('\n1. Health Check:');
    const health = await twelveLabsMockService.healthCheck();
    console.log('Status:', health.status);
    console.log('Details:', health.details);
    
    // Test 2: Search for passing touchdowns
    console.log('\n2. Search - Passing Touchdowns:');
    const passingTDs = await twelveLabsMockService.searchMoments(['passing touchdown'], undefined, 5);
    console.log(`Found ${passingTDs.length} moments`);
    passingTDs.forEach(moment => {
      console.log(`  - ${moment.label} (confidence: ${moment.confidence}, score: ${moment.score.toFixed(2)})`);
    });
    
    // Test 3: Search for Haynes King
    console.log('\n3. Search - Haynes King:');
    const haynesKing = await twelveLabsMockService.searchMoments(['Haynes King touchdown'], undefined, 3);
    console.log(`Found ${haynesKing.length} moments`);
    haynesKing.forEach(moment => {
      console.log(`  - ${moment.label} (${moment.videoId})`);
    });
    
    // Test 4: Search for deep balls
    console.log('\n4. Search - Deep Ball Completions:');
    const deepBalls = await twelveLabsMockService.searchMoments(['deep ball', 'long completion'], undefined, 3);
    console.log(`Found ${deepBalls.length} moments`);
    deepBalls.forEach(moment => {
      console.log(`  - ${moment.label} (${moment.startTime}s-${moment.endTime}s)`);
    });
    
    console.log('\n✅ All tests completed successfully!');
    console.log('🎯 TwelveLabs Mock Service is ready for demo.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testMockService();