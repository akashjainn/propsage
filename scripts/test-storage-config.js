/**
 * Simple test script to verify cloud storage configuration
 */

const { config } = require('dotenv');
config();

async function testCloudStorage() {
  console.log('🧪 Testing Cloud Storage Configuration\n');
  
  // Check environment variables
  console.log('📊 Environment Variables:');
  console.log(`   R2_ENDPOINT: ${process.env.R2_ENDPOINT ? '✅ Set' : '❌ Missing'}`);
  console.log(`   VIDEO_BUCKET_NAME: ${process.env.VIDEO_BUCKET_NAME || '❌ Missing'}`);
  console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}`);
  
  if (process.env.R2_ENDPOINT) {
    console.log(`\n🔗 Cloudflare R2 Configuration Detected:`);
    console.log(`   Endpoint: ${process.env.R2_ENDPOINT}`);
    console.log(`   Bucket: ${process.env.VIDEO_BUCKET_NAME || 'propsage-vid-storage'}`);
    
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('   ✅ Credentials configured - ready for testing');
      console.log('\n💡 Next steps:');
      console.log('   1. Add your R2 API credentials to .env');
      console.log('   2. Run: pnpm tl:index --limit=1');
    } else {
      console.log('   ⚠️  Credentials missing - add to .env:');
      console.log('   AWS_ACCESS_KEY_ID=your-r2-access-key');
      console.log('   AWS_SECRET_ACCESS_KEY=your-r2-secret-key');
    }
  } else {
    console.log('\n❌ No cloud storage configuration found');
  }
}

testCloudStorage().catch(console.error);