/**
 * Monitor TwelveLabs indexing status
 * Run: node apps/api/check-tl-status.js
 */

const TL_API_KEY = process.env.TWELVELABS_API_KEY || process.env.TL_API_KEY;
const TL_INDEX_ID = process.env.TWELVELABS_INDEX_ID;
const TL_BASE_URL = process.env.TWELVELABS_BASE_URL || 'https://api.twelvelabs.io/v1.3';

if (!TL_API_KEY || !TL_INDEX_ID) {
  console.error('❌ Missing TWELVELABS_API_KEY or TWELVELABS_INDEX_ID');
  process.exit(1);
}

async function checkStatus() {
  try {
    const response = await fetch(
      `${TL_BASE_URL}/indexes/${TL_INDEX_ID}/videos?page=1&page_limit=50`,
      { headers: { 'x-api-key': TL_API_KEY } }
    );

    if (!response.ok) throw new Error(`API Error ${response.status}`);

    const data = await response.json();
    const videos = data.data || [];
    
    const ready = videos.filter(v => v.indexed_at).length;
    const indexing = videos.length - ready;
    
    console.log(`\n📊 Indexing Status:`);
    console.log(`   ✅ Ready: ${ready}`);
    console.log(`   ⏳ Indexing: ${indexing}`);
    console.log(`   📁 Total: ${videos.length}\n`);
    
    if (ready > 0) {
      console.log('✅ Ready videos:');
      videos
        .filter(v => v.indexed_at)
        .forEach(v => {
          console.log(`   - ${v.metadata?.filename || v._id}`);
        });
    }
    
    if (indexing > 0) {
      console.log('\n⏳ Still indexing... Check back in a few minutes.');
    } else {
      console.log('\n✅ All videos indexed! Run list-tl-videos.js to see details.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStatus();
