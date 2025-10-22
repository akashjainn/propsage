/**
 * Script to list all videos in your TwelveLabs index
 * Run: node apps/api/list-tl-videos.js
 */

const TL_API_KEY = process.env.TWELVELABS_API_KEY || process.env.TL_API_KEY;
const TL_INDEX_ID = process.env.TWELVELABS_INDEX_ID;
const TL_BASE_URL = process.env.TWELVELABS_BASE_URL || 'https://api.twelvelabs.io/v1.3';

if (!TL_API_KEY) {
  console.error('❌ Missing TWELVELABS_API_KEY environment variable');
  process.exit(1);
}

if (!TL_INDEX_ID) {
  console.error('❌ Missing TWELVELABS_INDEX_ID environment variable');
  process.exit(1);
}

async function listVideos() {
  try {
    console.log(`\n🔍 Fetching videos from index: ${TL_INDEX_ID}\n`);
    
    const response = await fetch(
      `${TL_BASE_URL}/indexes/${TL_INDEX_ID}/videos?page=1&page_limit=50`,
      {
        headers: {
          'x-api-key': TL_API_KEY
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    const data = await response.json();
    
    console.log(`Found ${data.data?.length || 0} videos:\n`);
    
    data.data?.forEach((video, index) => {
      console.log(`${index + 1}. Video ID: ${video._id}`);
      console.log(`   Filename: ${video.system_metadata?.filename || 'N/A'}`);
      console.log(`   Status: ${video.hls?.status === 'COMPLETE' ? '✅ Ready' : '⏳ Indexing'}`);
      console.log(`   Duration: ${video.system_metadata?.duration ? Math.round(video.system_metadata.duration) : 'N/A'}s`);
      console.log(`   Created: ${video.created_at || 'N/A'}`);
      console.log('');
    });
    
    // Find Gunner Stockton video
    const gunnerVideo = data.data?.find(v => 
      v.system_metadata?.filename?.toLowerCase().includes('gunner stockton')
    );
    
    if (gunnerVideo) {
      console.log('\n✅ Found Gunner Stockton video:');
      console.log(`   Video ID: ${gunnerVideo._id}`);
      console.log(`   Filename: ${gunnerVideo.system_metadata?.filename}`);
      console.log('\n📝 Update your evidence-service.ts mock data:');
      console.log(`   tlVideoId: '${gunnerVideo._id}'`);
    } else {
      console.log('\n❌ No video found with "Gunner Stockton" in filename');
      console.log('   Make sure your video is uploaded and indexed first');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listVideos();
