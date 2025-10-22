/**
 * Check raw TwelveLabs API response to debug indexing status
 */

const TL_API_KEY = process.env.TWELVELABS_API_KEY || process.env.TL_API_KEY;
const TL_INDEX_ID = process.env.TWELVELABS_INDEX_ID;
const TL_BASE_URL = process.env.TWELVELABS_BASE_URL || 'https://api.twelvelabs.io/v1.3';

if (!TL_API_KEY || !TL_INDEX_ID) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

async function checkRaw() {
  try {
    const response = await fetch(
      `${TL_BASE_URL}/indexes/${TL_INDEX_ID}/videos?page=1&page_limit=5`,
      { headers: { 'x-api-key': TL_API_KEY } }
    );

    if (!response.ok) {
      console.error('❌ API Error:', response.status, await response.text());
      return;
    }

    const data = await response.json();
    
    console.log('\n📦 Raw API Response Sample:\n');
    console.log(JSON.stringify(data.data?.[0], null, 2));
    
    console.log('\n\n📊 Summary:');
    console.log('Total videos:', data.data?.length || 0);
    
    const firstVideo = data.data?.[0];
    if (firstVideo) {
      console.log('\nFirst video structure:');
      console.log('  - _id:', firstVideo._id);
      console.log('  - indexed_at:', firstVideo.indexed_at || 'null');
      console.log('  - metadata:', firstVideo.metadata ? JSON.stringify(firstVideo.metadata) : 'null');
      console.log('  - hls:', firstVideo.hls ? 'present' : 'null');
      console.log('  - system:', firstVideo.system ? JSON.stringify(firstVideo.system) : 'null');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRaw();
