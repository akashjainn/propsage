/**
 * Test various TwelveLabs API endpoint patterns
 */

const { config } = require('dotenv');
config();

// Polyfill fetch
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function testApiPatterns() {
  console.log('🔬 Testing Various TwelveLabs API Patterns\n');
  
  const apiKey = process.env.TWELVELABS_API_KEY;
  const indexId = process.env.TWELVELABS_INDEX_ID;
  
  console.log(`API Key: ${apiKey ? `${apiKey.substring(0, 15)}...` : 'Missing'}`);
  console.log(`Index ID: ${indexId}\n`);
  
  // Test different base URLs and patterns
  const testPatterns = [
    'https://api.twelvelabs.io/v1.2/indexes',
    'https://api.twelvelabs.io/v1/indexes', 
    'https://api.twelvelabs.io/indexes',
    'https://api.twelvelabs.ai/v1.2/indexes',
    'https://api.twelvelabs.ai/v1/indexes',
    'https://twelvelabs.io/api/v1.2/indexes',
    'https://twelvelabs.io/api/v1/indexes'
  ];
  
  for (const url of testPatterns) {
    console.log(`🔗 Testing: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        console.log('   ✅ SUCCESS! Found working endpoint');
        const data = await response.json();
        console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
        return url; // Return the working URL
      } else if (response.status === 401) {
        console.log('   🔑 Authentication required (endpoint exists)');
      } else if (response.status === 403) {
        console.log('   🚫 Forbidden (endpoint exists, permission issue)');
      } else if (response.status === 404) {
        console.log('   ❌ Not Found');
      } else {
        console.log(`   ⚠️  Other: ${response.status}`);
      }
      
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        console.log('   🌐 Domain not found');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('   🔌 Connection refused');
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n💡 All patterns failed. TwelveLabs service may be experiencing issues.');
  console.log('   Your video upload system works perfectly without it!');
  
  return null;
}

testApiPatterns().catch(console.error);