/**
 * Simple video upload test script
 */

const { config } = require('dotenv');
config();

async function testVideoUpload() {
  console.log('🎬 PropSage Video Upload Test\n');
  
  // Check if credentials are available
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('❌ Missing R2 credentials. Please add to your .env file:');
    console.log('   AWS_ACCESS_KEY_ID=your-r2-access-key-id');
    console.log('   AWS_SECRET_ACCESS_KEY=your-r2-secret-access-key');
    console.log('\n📝 Get these from:');
    console.log('   1. Cloudflare Dashboard → R2 Object Storage');
    console.log('   2. Manage R2 API Tokens → Create Token');
    console.log('   3. Set permissions: "Object Read & Write"');
    return;
  }
  
  try {
    // Try to load the video storage service
    const { videoStorage } = require('../apps/api/dist/services/video-storage.js');
    
    if (!videoStorage.isCloudStorageConfigured()) {
      console.log('❌ Cloud storage not properly configured');
      return;
    }
    
    console.log('✅ Cloud storage configured successfully!');
    console.log('\n🚀 Ready to upload videos! Run:');
    console.log('   pnpm tl:index --limit=1    # Test with 1 video');
    console.log('   pnpm tl:index              # Upload all videos');
    
  } catch (error) {
    console.log('⚠️  Could not load video storage service:', error.message);
    console.log('💡 Make sure to build the API first: pnpm --filter @propsage/api build');
  }
}

testVideoUpload().catch(console.error);