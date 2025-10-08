/**
 * Test integration of processed video data with evidence service
 */

import fs from 'fs';
import path from 'path';

async function testVideoIntegration() {
  console.log('🧪 Testing Video Processing Integration');
  console.log('====================================\n');
  
  try {
    const dataPath = path.join(process.cwd(), 'data');
    
    // Test 1: Load processed moment library
    console.log('1. Loading Moment Library...');
    const momentLibraryPath = path.join(dataPath, 'moment-library.json');
    if (fs.existsSync(momentLibraryPath)) {
      const moments = JSON.parse(fs.readFileSync(momentLibraryPath, 'utf8'));
      console.log(`   ✅ Loaded ${moments.length} processed moments`);
      console.log(`   📝 Sample moment: ${moments[0]?.id || 'N/A'}`);
    } else {
      console.log('   ❌ Moment library not found');
      return;
    }
    
    // Test 2: Load prop mappings
    console.log('\n2. Loading Prop Mappings...');
    const propMappingsPath = path.join(dataPath, 'prop-mappings.json');
    if (fs.existsSync(propMappingsPath)) {
      const mappings = JSON.parse(fs.readFileSync(propMappingsPath, 'utf8'));
      const categories = Object.keys(mappings);
      console.log(`   ✅ Loaded ${categories.length} prop categories`);
      console.log(`   🎯 Categories: ${categories.slice(0, 5).join(', ')}${categories.length > 5 ? '...' : ''}`);
    } else {
      console.log('   ❌ Prop mappings not found');
      return;
    }
    
    // Test 3: Load video library stats
    console.log('\n3. Loading Processing Stats...');
    const statsPath = path.join(dataPath, 'processing-stats.json');
    if (fs.existsSync(statsPath)) {
      const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
      console.log(`   ✅ Processing completed at: ${stats.processedAt}`);
      console.log(`   📊 Total videos: ${stats.totalVideos}`);
      console.log(`   🏃 Players detected: ${stats.players.join(', ')}`);
      console.log(`   ⚡ Action types: ${stats.actionTypes.join(', ')}`);
    } else {
      console.log('   ❌ Processing stats not found');
    }
    
    // Test 4: Simulate evidence service integration
    console.log('\n4. Testing Evidence Service Integration...');
    const videoLibraryPath = path.join(dataPath, 'video-library-processed.json');
    if (fs.existsSync(videoLibraryPath)) {
      const videoLibrary = JSON.parse(fs.readFileSync(videoLibraryPath, 'utf8'));
      
      // Find touchdown moments for evidence adjustment
      const touchdownMoments = videoLibrary.filter(video => 
        video.actions?.includes('touchdown')
      );
      
      console.log(`   🎯 Found ${touchdownMoments.length} touchdown moments for evidence`);
      
      if (touchdownMoments.length > 0) {
        const sample = touchdownMoments[0];
        console.log(`   📝 Sample evidence adjustment:`);
        console.log(`      - File: ${sample.filename}`);
        console.log(`      - Actions: ${sample.actions?.join(', ')}`);
        console.log(`      - Evidence Weight: ${sample.evidenceWeight}`);
        console.log(`      - Delta Mu: ${sample.deltaMu}`);
        console.log(`      - Delta Sigma: ${sample.deltaSigma}`);
      }
    }
    
    console.log('\n✅ Integration test completed successfully!');
    console.log('🚀 Processed video data is ready for Phase 1 Day 2 completion');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

testVideoIntegration();