/**
 * Basic TwelveLabs API test
 */

const { config } = require('dotenv');
config();

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function basicTest() {
  console.log('🔍 Basic TwelveLabs API Test\n');
  
  const apiKey = process.env.TWELVELABS_API_KEY;
  console.log(`API Key: ${apiKey ? `${apiKey.substring(0, 8)}...` : 'Missing'}`);
  
  if (!apiKey) {
    console.log('❌ No API key found');
    return;
  }
  
  // Test basic connectivity
  console.log('\n🌐 Testing basic connectivity...');
  
  const endpoints = [
    'https://api.twelvelabs.io',
    'https://api.twelvelabs.io/v1',
    'https://api.twelvelabs.io/v1.2',
    'https://api.twelvelabs.io/v1/engines',
    'https://api.twelvelabs.io/v1.2/engines'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`   Testing: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const data = await response.text();
        console.log(`   ✅ Success! Response length: ${data.length} chars`);
        break;
      } else if (response.status === 401) {
        console.log('   ❌ Authentication failed - check API key');
      } else if (response.status === 404) {
        console.log('   ⚠️  Endpoint not found');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n💡 If all endpoints return 404, the API key might be invalid or the service might be down.');
  console.log('   Try regenerating your TwelveLabs API key from the dashboard.');
}

basicTest().catch(console.error);