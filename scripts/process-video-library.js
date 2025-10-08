/**
 * Video Processing Pipeline - Phase 1 Day 2
 * 
 * Processes our 13 CFB clips to create a comprehensive moment library
 * with metadata, searchable tags, and integration with our pricing engine.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Video clips directory
const CLIPS_DIR = path.join(__dirname, '../apps/web/clips');
const OUTPUT_DIR = path.join(__dirname, '../data');

/**
 * Extract metadata from filename patterns
 */
function parseVideoFilename(filename) {
  const nameWithoutExt = filename.replace('.mp4', '');
  const parts = nameWithoutExt.split(' ');
  
  // Extract date (9-27 format)
  const dateMatch = parts[0].match(/(\d+)-(\d+)/);
  const date = dateMatch ? `2024-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}` : null;
  
  // Extract teams (next two parts typically)
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
  
  // Extract yardage if mentioned
  const yardageMatch = nameWithoutExt.match(/(\d+)\s*(?:yard|yd)/i);
  const yardage = yardageMatch ? parseInt(yardageMatch[1]) : null;
  
  return {
    filename,
    date,
    teams,
    playerNames,
    actions,
    yardage,
    rawDescription: nameWithoutExt
  };
}

/**
 * Generate PropSage-specific metadata for pricing integration
 */
function generatePropMetadata(parsedData) {
  const { actions, playerNames, yardage, teams } = parsedData;
  
  // Determine prop categories this moment could affect
  const propCategories = [];
  
  if (actions.includes('touchdown')) {
    propCategories.push('anytime_touchdown', 'first_touchdown');
    if (actions.includes('passing')) propCategories.push('passing_touchdowns');
    if (actions.includes('rushing')) propCategories.push('rushing_touchdowns');
  }
  
  if (actions.includes('passing')) {
    propCategories.push('passing_yards', 'completions', 'pass_attempts');
    if (yardage) propCategories.push('longest_completion');
  }
  
  if (actions.includes('rushing')) {
    propCategories.push('rushing_yards', 'rushing_attempts');
    if (yardage) propCategories.push('longest_rush');
  }
  
  if (actions.includes('fumble') || actions.includes('interception')) {
    propCategories.push('turnovers', 'defensive_props');
  }
  
  // Evidence impact scoring
  let evidenceWeight = 0.5; // Default
  let deltaMu = 0; // Mean adjustment
  let deltaSigma = 0; // Variance adjustment
  
  if (actions.includes('touchdown')) {
    evidenceWeight = 0.8;
    deltaMu = 0.15; // Positive adjustment for touchdown capability
    deltaSigma = -0.05; // Reduce uncertainty
  } else if (actions.includes('fumble') || actions.includes('interception') || actions.includes('drop')) {
    evidenceWeight = 0.7;
    deltaMu = -0.10; // Negative adjustment for mistakes
    deltaSigma = 0.02; // Slight increase in uncertainty
  }
  
  return {
    propCategories,
    evidenceWeight,
    deltaMu,
    deltaSigma,
    searchTags: [
      ...actions,
      ...playerNames.map(name => name.toLowerCase()),
      teams.toLowerCase().replace(' vs ', ' '),
      yardage ? `${yardage}yard` : null
    ].filter(Boolean)
  };
}

/**
 * Generate TwelveLabs-compatible moment data
 */
function generateTLMomentData(parsedData, propMetadata, index) {
  const { filename, actions, playerNames, yardage } = parsedData;
  
  // Generate realistic timing (most clips are 6-9 seconds)
  const duration = 6 + Math.random() * 3; // 6-9 seconds
  const startTime = Math.random() * 2; // 0-2 seconds start
  const endTime = startTime + duration;
  
  // Generate confidence based on content clarity
  let confidence = 'medium';
  if (actions.includes('touchdown')) confidence = 'high';
  if (actions.includes('fumble') || actions.includes('interception')) confidence = 'high';
  if (actions.includes('drop')) confidence = 'low';
  
  // Generate search-optimized text
  const searchText = [
    actions.join(', '),
    playerNames.join(' '),
    yardage ? `${yardage} yard play` : null,
    actions.includes('touchdown') ? 'scores touchdown' : null
  ].filter(Boolean).join(' ');
  
  return {
    id: `moment_${index + 1}_${filename.replace('.mp4', '').replace(/\s+/g, '_')}`,
    videoId: `video_${filename.replace('.mp4', '').replace(/\s+/g, '_')}`,
    start: parseFloat(startTime.toFixed(1)),
    end: parseFloat(endTime.toFixed(1)),
    text: searchText,
    confidence,
    metadata: {
      filename,
      actions,
      players: playerNames,
      yardage,
      propRelevance: propMetadata.propCategories
    }
  };
}

/**
 * Main processing function
 */
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
      const parsedData = parseVideoFilename(filename);
      console.log(`   📊 Teams: ${parsedData.teams}`);
      console.log(`   🏃 Players: ${parsedData.playerNames.join(', ') || 'None detected'}`);
      console.log(`   ⚡ Actions: ${parsedData.actions.join(', ') || 'None detected'}`);
      
      // Generate PropSage metadata
      const propMetadata = generatePropMetadata(parsedData);
      console.log(`   🎯 Prop Categories: ${propMetadata.propCategories.join(', ')}`);
      
      // Generate TwelveLabs moment data
      const tlMoment = generateTLMomentData(parsedData, propMetadata, i);
      
      // Store processed data
      const videoEntry = {
        ...parsedData,
        ...propMetadata,
        tlMoment,
        processedAt: new Date().toISOString()
      };
      
      processedVideos.push(videoEntry);
      momentLibrary.push(tlMoment);
      
      // Build prop mappings
      propMetadata.propCategories.forEach(category => {
        if (!propMappings[category]) propMappings[category] = [];
        propMappings[category].push({
          momentId: tlMoment.id,
          filename: filename,
          evidenceWeight: propMetadata.evidenceWeight,
          deltaMu: propMetadata.deltaMu,
          deltaSigma: propMetadata.deltaSigma
        });
      });
      
      console.log(`   ✅ Processed successfully\n`);
    }
    
    // Generate summary statistics
    const stats = {
      totalVideos: videoFiles.length,
      totalMoments: momentLibrary.length,
      propCategories: Object.keys(propMappings).length,
      actionTypes: [...new Set(processedVideos.flatMap(v => v.actions))],
      players: [...new Set(processedVideos.flatMap(v => v.playerNames))],
      teams: [...new Set(processedVideos.map(v => v.teams))],
      processedAt: new Date().toISOString()
    };
    
    // Save all processed data
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
    
    // Print summary
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
    
    return {
      success: true,
      stats,
      outputFiles: Object.keys(outputs)
    };
    
  } catch (error) {
    console.error('❌ Error processing video library:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processVideoLibrary().catch(console.error);
}

export { processVideoLibrary };