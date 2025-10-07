/**
 * Test TwelveLabs API connection
 */

const { config } = require('dotenv');
const https = require('https');
config();

async function testTwelveLabsConnection() {
  console.log('🔍 Testing TwelveLabs API Connection\n');
  
  const apiKey = process.env.TWELVELABS_API_KEY;
  const indexId = process.env.TWELVELABS_INDEX_ID;
  const baseUrl = process.env.TWELVELABS_BASE_URL || 'https://api.twelvelabs.io/v1.2';
  
  console.log('\n🔬 Testing different API versions...');
  
  // Test v1.2 first
  console.log('   Testing v1.2 endpoint...');
  try {
    const v12Response = await fetch('https://api.twelvelabs.io/v1.2/indexes', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log(`   v1.2 status: ${v12Response.status}`);
    if (v12Response.status === 401) {
      console.log('   v1.2: Authentication issue (check API key)');
    } else if (v12Response.status === 200) {
      const indexes = await v12Response.json();
      console.log(`   v1.2: Found ${indexes.data?.length || 0} indexes`);
      if (indexes.data) {
        indexes.data.forEach((idx, i) => {
          console.log(`     ${i + 1}. ${idx._id} - ${idx.index_name}`);
        });
      }
    }
  } catch (error) {
    console.log(`   v1.2 error: ${error.message}`);
  }
  
  // Test v1 as fallback
  console.log('   Testing v1 endpoint...');
  try {
    const v1Response = await fetch('https://api.twelvelabs.io/v1/indexes', {
      method: 'GET', 
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log(`   v1 status: ${v1Response.status}`);
  } catch (error) {
    console.log(`   v1 error: ${error.message}`);
  }
  
  console.log('📊 Configuration:');
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   API Key: ${apiKey ? `${apiKey.substring(0, 8)}...` : 'Missing'}`);
  console.log(`   Index ID: ${indexId || 'Missing'}`);
  
  if (!apiKey || !indexId) {
    console.log('\n❌ Missing TwelveLabs credentials');
    return;
  }
  
  // Test basic API health
  console.log('\n🔗 Testing API Health...');
  
  try {
    const response = await fetch(`${baseUrl}/indexes/${indexId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ TwelveLabs API connection successful');
      console.log(`   Index Name: ${data.index_name || 'N/A'}`);
      console.log(`   Engine: ${data.engines?.join(', ') || 'N/A'}`);
    } else {
      console.log(`❌ TwelveLabs API error: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Response: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Connection error: ${error.message}`);
  }
}

// Polyfill fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testTwelveLabsConnection().catch(console.error);