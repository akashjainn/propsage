#!/usr/bin/env node
/**
 * Video Indexing Script for TwelveLabs
 * Uploads local video clips and indexes them with TwelveLabs
 * 
 * Usage: node scripts/index-videos.js [--upload-only] [--index-only] [--limit=N]
 */

const { config } = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment
config();

const CLIPS_DIR = path.join(process.cwd(), 'apps/web/clips');
const BATCH_SIZE = 3; // Index 3 videos at a time to avoid rate limits

async function getLocalVideos() {
  if (!fs.existsSync(CLIPS_DIR)) {
    throw new Error(`Clips directory not found: ${CLIPS_DIR}`);
  }
  
  const files = fs.readdirSync(CLIPS_DIR);
  const videoFiles = files.filter(file => 
    file.toLowerCase().endsWith('.mp4') || 
    file.toLowerCase().endsWith('.mov') ||
    file.toLowerCase().endsWith('.avi')
  );
  
  return videoFiles.map(filename => ({
    filename,
    filepath: path.join(CLIPS_DIR, filename),
    size: fs.statSync(path.join(CLIPS_DIR, filename)).size
  }));
}

function parseVideoMetadata(filename) {
  // Parse filename: "9-27 georgia tech wake forest haynes king passing touchdown from 3rd and 10 to begin comeback.mp4"
  const parts = filename.replace('.mp4', '').split(' ');
  
  if (parts.length < 3) {
    return {
      date: '2024-09-27',
      team1: 'UNKNOWN',
      team2: 'UNKNOWN',
      description: filename.replace('.mp4', ''),
      originalFilename: filename
    };
  }
  
  const dateStr = parts[0]; // "9-27"
  const date = `2024-${dateStr.padStart(5, '0').replace('-', '-')}`;
  
  // Try to extract team names (usually positions 1-4)
  const possibleTeams = parts.slice(1, 5);
  const team1 = possibleTeams[0]?.toUpperCase() || 'TEAM1';
  const team2 = possibleTeams[1]?.toUpperCase() || 'TEAM2';
  
  return {
    date,
    team1,
    team2,
    description: parts.slice(1).join(' '),
    originalFilename: filename
  };
}

async function checkCloudStorageStatus() {
  try {
    const { videoStorage } = await import('../apps/api/dist/services/video-storage.js');
    
    if (!videoStorage.isCloudStorageConfigured()) {
      console.log('☁️  Cloud storage not configured. Detected configuration:');
      
      const hasAwsKeys = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
      const hasR2Endpoint = process.env.R2_ENDPOINT;
      
      if (hasR2Endpoint) {
        console.log('   🔧 Cloudflare R2 detected but incomplete');
        console.log('   💡 Run: pnpm setup:storage:r2 --create-bucket');
      } else if (hasAwsKeys) {
        console.log('   🔧 AWS S3 detected but incomplete');
        console.log('   💡 Run: pnpm setup:storage:aws --create-bucket');
      } else {
        console.log('   ❌ No cloud storage credentials found');
        console.log('   💡 Run: pnpm setup:storage');
      }
      
      return false;
    }
    
    console.log('✅ Cloud storage configured and ready');
    return true;
    
  } catch (error) {
    console.log('⚠️  Could not check cloud storage status:', error.message);
    return false;
  }
}

async function uploadVideos(videos, uploadOnly = false) {
  console.log(`🚀 ${uploadOnly ? 'Uploading' : 'Processing'} ${videos.length} videos...\n`);
  
  const results = [];
  
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    console.log(`\n📁 Processing ${i + 1}/${videos.length}: ${video.filename}`);
    console.log(`   Size: ${(video.size / 1024 / 1024).toFixed(2)} MB`);
    
    try {
      const metadata = parseVideoMetadata(video.filename);
      console.log(`   Game: ${metadata.team1} vs ${metadata.team2} (${metadata.date})`);
      
      // Upload to cloud storage
      const { videoStorage } = await import('../apps/api/dist/services/video-storage.js');
      
      console.log('   ☁️  Uploading to cloud storage...');
      const uploadResult = await videoStorage.uploadVideo(video.filepath, metadata);
      
      console.log(`   ✅ Uploaded: ${uploadResult.s3Url}`);
      
      const result = {
        filename: video.filename,
        metadata,
        uploadResult,
        indexed: false
      };
      
      // Index with TwelveLabs (unless upload-only mode)
      if (!uploadOnly) {
        try {
          console.log('   🔍 Indexing with TwelveLabs...');
          const { TwelveLabsClient } = await import('../apps/api/dist/services/twelve-labs-client.js');
          const tlClient = new TwelveLabsClient();
          
          const indexResult = await tlClient.indexClip({
            clipUrl: uploadResult.s3Url,
            metadata: {
              filename: video.filename,
              gameDate: metadata.date,
              teams: `${metadata.team1} vs ${metadata.team2}`,
              description: metadata.description
            }
          });
          
          result.indexResult = indexResult;
          result.indexed = true;
          
          console.log(`   ✅ Indexed with TwelveLabs: ${indexResult.taskId}`);
          
        } catch (error) {
          console.error(`   ❌ TwelveLabs indexing failed: ${error.message}`);
          result.indexError = error.message;
        }
      }
      
      results.push(result);
      
    } catch (error) {
      console.error(`   ❌ Failed to process ${video.filename}: ${error.message}`);
      results.push({
        filename: video.filename,
        error: error.message
      });
    }
    
    // Small delay between videos
    if (i < videos.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

async function indexExistingVideos() {
  console.log('🔍 Indexing already uploaded videos with TwelveLabs...\n');
  
  try {
    const { videoStorage } = await import('../apps/api/dist/services/video-storage.js');
    const { TwelveLabsClient } = await import('../apps/api/dist/services/twelve-labs-client.js');
    const tlClient = new TwelveLabsClient();
    
    // Get list of uploaded videos (this would need to be implemented)
    // For now, we'll assume they're in cloud storage with predictable names
    
    console.log('⚠️  Index-only mode requires a database or manifest of uploaded videos.');
    console.log('   Consider running without --index-only to upload and index together.');
    
  } catch (error) {
    console.error('❌ Failed to index existing videos:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const uploadOnly = args.includes('--upload-only');
  const indexOnly = args.includes('--index-only');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;
  
  console.log('🎬 PropSage Video Indexing Script\n');
  
  // Check cloud storage status first
  if (!indexOnly) {
    const storageReady = await checkCloudStorageStatus();
    if (!storageReady) {
      console.log('\n❌ Cloud storage setup required before uploading videos.');
      process.exit(1);
    }
  }
  
  if (indexOnly) {
    await indexExistingVideos();
    return;
  }
  
  try {
    // Get local videos
    const allVideos = await getLocalVideos();
    const videos = limit ? allVideos.slice(0, limit) : allVideos;
    
    console.log(`📊 Found ${allVideos.length} local videos`);
    if (limit) {
      console.log(`🎯 Processing first ${videos.length} videos (--limit=${limit})`);
    }
    
    if (videos.length === 0) {
      console.log('⚠️  No videos found to process.');
      return;
    }
    
    // Process videos in batches
    const results = [];
    for (let i = 0; i < videos.length; i += BATCH_SIZE) {
      const batch = videos.slice(i, i + BATCH_SIZE);
      console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(videos.length / BATCH_SIZE)}`);
      
      const batchResults = await uploadVideos(batch, uploadOnly);
      results.push(...batchResults);
      
      // Longer delay between batches
      if (i + BATCH_SIZE < videos.length) {
        console.log('\n⏳ Waiting 5 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Summary
    console.log('\n📊 Processing Summary:');
    console.log('=' .repeat(50));
    
    const successful = results.filter(r => r.uploadResult && !r.error);
    const failed = results.filter(r => r.error);
    const indexed = results.filter(r => r.indexed);
    const indexFailed = results.filter(r => r.uploadResult && r.indexError);
    
    console.log(`✅ Successfully uploaded: ${successful.length}/${results.length}`);
    if (!uploadOnly) {
      console.log(`🔍 Successfully indexed: ${indexed.length}/${successful.length}`);
      if (indexFailed.length > 0) {
        console.log(`⚠️  Index failures: ${indexFailed.length}`);
      }
    }
    if (failed.length > 0) {
      console.log(`❌ Upload failures: ${failed.length}`);
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed videos:');
      failed.forEach(r => console.log(`   - ${r.filename}: ${r.error}`));
    }
    
    if (indexFailed.length > 0) {
      console.log('\n⚠️  Index failures:');
      indexFailed.forEach(r => console.log(`   - ${r.filename}: ${r.indexError}`));
    }
    
    console.log('\n🎉 Video processing complete!');
    
    // Save results for reference
    const resultFile = path.join(process.cwd(), 'video-processing-results.json');
    fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${resultFile}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}