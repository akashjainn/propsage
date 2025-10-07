/**
 * Test TwelveLabs with curl-like approach
 */

const { config } = require('dotenv');
config();

// Polyfill fetch
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function testWithCurl() {
  console.log('🔍 TwelveLabs CURL-style Test\n');
  
  const apiKey = process.env.TWELVELABS_API_KEY;
  const indexId = process.env.TWELVELABS_INDEX_ID;
  
  console.log(`API Key: ${apiKey ? `${apiKey.substring(0, 12)}...` : 'Missing'}`);
  console.log(`Index ID: ${indexId}`);
  
  if (!apiKey) {
    console.log('❌ No API key found');
    return;
  }
  
  // Try the exact endpoint structure that might work
  const testEndpoints = [
    {
      name: 'List Indexes (v1.2)',
      url: 'https://api.twelvelabs.io/v1.2/indexes',
      method: 'GET'
    },
    {
      name: 'Get Specific Index (v1.2)', 
      url: `https://api.twelvelabs.io/v1.2/indexes/${indexId}`,
      method: 'GET'
    },
    {
      name: 'List Indexes (v1)',
      url: 'https://api.twelvelabs.io/v1/indexes', 
      method: 'GET'
    }
  ];
  
  for (const test of testEndpoints) {
    console.log(`\n🔗 ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'X-API-Key': apiKey,
          'x-api-key': apiKey, // Try both header formats
          'Authorization': `Bearer ${apiKey}`, // Try bearer format
          'Content-Type': 'application/json',
          'User-Agent': 'PropSage/1.0'
        }
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log(`   ✅ Success!`);
        console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
        if (data.data && Array.isArray(data.data)) {
          console.log(`   Found ${data.data.length} items`);
        }
        return; // Stop on first success
      } else if (response.status === 401) {
        console.log('   ❌ Authentication failed');
      } else if (response.status === 403) {
        console.log('   ❌ Forbidden - check permissions');
      } else if (response.status === 404) {
        console.log('   ⚠️  Not found');
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
  }
  
  console.log('\n💡 All endpoints failed. Possible issues:');
  console.log('   1. API key expired or invalid');
  console.log('   2. TwelveLabs service is down');
  console.log('   3. API endpoints have changed');
  console.log('   4. Network/firewall issues');
}

testWithCurl().catch(console.error);