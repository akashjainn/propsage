#!/usr/bin/env node

// Quick TwelveLabs connection test
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const API_KEY = process.env.TWELVELABS_API_KEY;
const INDEX_ID = process.env.TWELVELABS_INDEX_ID;

console.log('🔗 TwelveLabs Connection Test');
console.log('=====================================');
console.log('API Key configured:', !!API_KEY);
console.log('Index ID configured:', !!INDEX_ID);
console.log('API Key (partial):', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('Index ID:', INDEX_ID || 'NOT SET');

if (!API_KEY) {
  console.log('❌ No API key found. Please set TWELVELABS_API_KEY in .env');
  process.exit(1);
}

// Test API connection
const options = {
  hostname: 'api.twelvelabs.io',
  port: 443,
  path: `/v1.2/indexes/${INDEX_ID}`,
  method: 'GET',
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  }
};

console.log('\n🧪 Testing API connection...');

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅ Connection successful!');
        console.log('Available indexes:', parsed.data?.length || 0);
        
        if (INDEX_ID) {
          const hasIndex = parsed.data?.find(idx => idx.id === INDEX_ID);
          console.log('Target index found:', !!hasIndex);
          if (hasIndex) {
            console.log('Index name:', hasIndex.name);
            console.log('Index status:', hasIndex.ready ? 'Ready' : 'Not Ready');
          }
        }
      } else {
        console.log('❌ API Error:', parsed.message || 'Unknown error');
      }
    } catch (e) {
      console.log('❌ Failed to parse response:', data);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Request failed:', e.message);
});

req.setTimeout(10000, () => {
  console.log('❌ Request timeout');
  req.destroy();
});

req.end();