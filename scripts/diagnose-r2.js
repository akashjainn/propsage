/**
 * R2 Diagnostic Script - Help troubleshoot R2 setup
 */

const { config } = require('dotenv');
config();

function diagnoseR2Setup() {
  console.log('🔍 Cloudflare R2 Setup Diagnostics\n');
  
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.VIDEO_BUCKET_NAME;
  
  console.log('📊 Current Configuration:');
  console.log(`   R2_ENDPOINT: ${endpoint}`);
  console.log(`   VIDEO_BUCKET_NAME: ${bucket}`);
  console.log(`   AWS_ACCESS_KEY_ID: ${accessKey ? `${accessKey.substring(0, 4)}...${accessKey.substring(accessKey.length - 4)} (${accessKey.length} chars)` : 'Missing'}`);
  console.log(`   AWS_SECRET_ACCESS_KEY: ${secretKey ? `${secretKey.substring(0, 4)}...${secretKey.substring(secretKey.length - 4)} (${secretKey.length} chars)` : 'Missing'}`);
  
  console.log('\n🔍 Analysis:');
  
  if (!accessKey || !secretKey) {
    console.log('❌ Missing credentials');
    return;
  }
  
  // Check key lengths
  if (accessKey.length === 20) {
    console.log('⚠️  Access Key Length: 20 characters (AWS S3 format)');
    console.log('   🔧 Expected: 32 characters for Cloudflare R2');
    console.log('   💡 You may have provided AWS S3 credentials instead of R2 tokens');
  } else if (accessKey.length === 32) {
    console.log('✅ Access Key Length: 32 characters (R2 format)');
  } else {
    console.log(`⚠️  Access Key Length: ${accessKey.length} characters (unexpected format)`);
  }
  
  if (secretKey.length === 40) {
    console.log('⚠️  Secret Key Length: 40 characters (AWS S3 format)');
    console.log('   🔧 Expected: 43+ characters for Cloudflare R2');
  } else if (secretKey.length >= 43) {
    console.log('✅ Secret Key Length: 43+ characters (R2 format)');
  } else {
    console.log(`⚠️  Secret Key Length: ${secretKey.length} characters (unexpected format)`);
  }
  
  console.log('\n📝 How to Get Cloudflare R2 API Tokens:');
  console.log('   1. Go to: https://dash.cloudflare.com/?to=/:account/r2');
  console.log('   2. Click "Manage R2 API Tokens"');
  console.log('   3. Click "Create Token"');
  console.log('   4. Set permissions: "Object Read & Write"');
  console.log('   5. Scope: "Apply to specific bucket" → propsage-vid-storage');
  console.log('   6. Copy the generated token (32 chars) and secret (43+ chars)');
  
  console.log('\n🎯 Expected Format:');
  console.log('   AWS_ACCESS_KEY_ID=<32-character-r2-token>');
  console.log('   AWS_SECRET_ACCESS_KEY=<43+-character-r2-secret>');
}

diagnoseR2Setup();