import fs from 'fs/promises';
import path from 'path';

const CLIPS_DIR = 'c:\\Users\\akash\\Documents\\propsage\\apps\\web\\clips';
const OUTPUT_DIR = 'c:\\Users\\akash\\Documents\\propsage\\data';

async function processVideoLibrary() {
  console.log('🎬 Processing Video Library - Phase 1 Day 2');
  console.log('==========================================\n');
  
  try {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true }).catch(() => {});
    
    // Get all video files
    const files = await fs.readdir(CLIPS_DIR);
    const videoFiles = files.filter(file => file.endsWith('.mp4'));
    
    console.log(`📁 Found ${videoFiles.length} video files to process\n`);
    
    const processedVideos = [];
    const momentLibrary = [];
    const propMappings = {};
    
    for (let i = 0; i < videoFiles.length; i++) {
      const filename = videoFiles[i];
      console.log(`📽️  Processing: ${filename}`);
      
      // Parse filename for metadata
      const nameWithoutExt = filename.replace('.mp4', '');
      const parts = nameWithoutExt.split(' ');
      
      // Extract teams
      const teams = parts.slice(1, 3).join(' vs ');
      
      // Extract player names (capitalized words)
      const playerNames = parts.filter(part => 
        /^[A-Z][a-z]/.test(part) && !['Georgia', 'Tech', 'Wake', 'Forest', 'Illinois', 'USC', 'UGA', 'Alabama', 'Ole', 'Miss', 'LSU'].includes(part)
      );
      
      // Extract action types
      const actions = [];
      if (nameWithoutExt.includes('touchdown')) actions.push('touchdown');
      if (nameWithoutExt.includes('passing')) actions.push('passing');
      if (nameWithoutExt.includes('running') || nameWithoutExt.includes('rushing')) actions.push('rushing');
      if (nameWithoutExt.includes('fumble')) actions.push('fumble');
      if (nameWithoutExt.includes('interception')) actions.push('interception');
      if (nameWithoutExt.includes('drops')) actions.push('drop');
      
      // Extract yardage
      const yardageMatch = nameWithoutExt.match(/(\d+)\s*(?:yard|yd)/i);
      const yardage = yardageMatch ? parseInt(yardageMatch[1]) : null;
      
      console.log(`   📊 Teams: ${teams}`);
      console.log(`   🏃 Players: ${playerNames.join(', ') || 'None detected'}`);
      console.log(`   ⚡ Actions: ${actions.join(', ') || 'None detected'}`);
      if (yardage) console.log(`   📏 Yardage: ${yardage}`);
      
      // Determine prop categories
      const propCategories = [];
      
      if (actions.includes('touchdown')) {
        propCategories.push('anytime_touchdown', 'first_touchdown');
        if (actions.includes('passing')) propCategories.push('passing_touchdowns');
        if (actions.includes('rushing')) propCategories.push('rushing_touchdowns');
      }
      
      if (actions.includes('passing')) {
        propCategories.push('passing_yards', 'completions');
      }
      
      if (actions.includes('rushing')) {
        propCategories.push('rushing_yards', 'rushing_attempts');
      }
      
      if (actions.includes('fumble') || actions.includes('interception')) {
        propCategories.push('turnovers', 'defensive_props');
      }
      
      console.log(`   🎯 Prop Categories: ${propCategories.join(', ')}`);
      
      // Generate TwelveLabs moment data
      const duration = 6 + Math.random() * 3; // 6-9 seconds
      const startTime = Math.random() * 2; // 0-2 seconds start
      
      const tlMoment = {
        id: `moment_${i + 1}_${filename.replace('.mp4', '').replace(/\s+/g, '_')}`,
        videoId: `video_${filename.replace('.mp4', '').replace(/\s+/g, '_')}`,
        start: parseFloat(startTime.toFixed(1)),
        end: parseFloat((startTime + duration).toFixed(1)),
        text: [actions.join(', '), playerNames.join(' '), yardage ? `${yardage} yard play` : null].filter(Boolean).join(' '),
        confidence: actions.includes('touchdown') ? 'high' : 'medium',
        metadata: {
          filename,
          actions,
          players: playerNames,
          yardage,
          propRelevance: propCategories
        }
      };
      
      // Evidence impact
      let evidenceWeight = 0.5;
      let deltaMu = 0;
      let deltaSigma = 0;
      
      if (actions.includes('touchdown')) {
        evidenceWeight = 0.8;
        deltaMu = 0.15;
        deltaSigma = -0.05;
      } else if (actions.includes('fumble') || actions.includes('interception') || actions.includes('drop')) {
        evidenceWeight = 0.7;
        deltaMu = -0.10;
        deltaSigma = 0.02;
      }
      
      const videoEntry = {
        filename,
        teams,
        playerNames,
        actions,
        yardage,
        propCategories,
        evidenceWeight,
        deltaMu,
        deltaSigma,
        tlMoment,
        processedAt: new Date().toISOString()
      };
      
      processedVideos.push(videoEntry);
      momentLibrary.push(tlMoment);
      
      // Build prop mappings
      propCategories.forEach(category => {
        if (!propMappings[category]) propMappings[category] = [];
        propMappings[category].push({
          momentId: tlMoment.id,
          filename: filename,
          evidenceWeight,
          deltaMu,
          deltaSigma
        });
      });
      
      console.log(`   ✅ Processed successfully\n`);
    }
    
    // Generate summary
    const stats = {
      totalVideos: videoFiles.length,
      totalMoments: momentLibrary.length,
      propCategories: Object.keys(propMappings).length,
      actionTypes: [...new Set(processedVideos.flatMap(v => v.actions))],
      players: [...new Set(processedVideos.flatMap(v => v.playerNames))],
      teams: [...new Set(processedVideos.map(v => v.teams))],
      processedAt: new Date().toISOString()
    };
    
    // Save outputs
    const outputs = {
      'video-library-processed.json': processedVideos,
      'moment-library.json': momentLibrary,
      'prop-mappings.json': propMappings,
      'processing-stats.json': stats
    };
    
    for (const [filename, data] of Object.entries(outputs)) {
      const filepath = path.join(OUTPUT_DIR, filename);
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      console.log(`💾 Saved: ${filename}`);
    }
    
    console.log('\n📊 Processing Summary:');
    console.log('=====================');
    console.log(`Videos Processed: ${stats.totalVideos}`);
    console.log(`Moments Created: ${stats.totalMoments}`);
    console.log(`Prop Categories: ${stats.propCategories}`);
    console.log(`Action Types: ${stats.actionTypes.join(', ')}`);
    console.log(`Players Detected: ${stats.players.join(', ')}`);
    console.log(`Teams: ${stats.teams.join(', ')}`);
    
    console.log('\n✅ Video Processing Pipeline Complete!');
    console.log('🚀 Ready for integration with evidence service');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

processVideoLibrary();