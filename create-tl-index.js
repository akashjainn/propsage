#!/usr/bin/env node

// Create TwelveLabs Index for PropSage Sports Analytics
const https = require('https');

const API_KEY = 'tlk_3YN6ZF80FS8KBA2VWEZWF0SMM457';

const indexData = JSON.stringify({
  name: "PropSage Sports Analytics",
  engines: [
    {
      name: "marengo2.6",
      options: ["visual", "conversation", "text_in_video"]
    }
  ]
});

const options = {
  hostname: 'api.twelvelabs.io',
  port: 443,
  path: '/v1/indexes',
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(indexData)
  }
};

console.log('🏗️  Creating TwelveLabs Index for PropSage');
console.log('==========================================');

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ Index created successfully!');
        console.log('Index ID:', parsed.id);
        console.log('Index Name:', parsed.name);
        console.log('');
        console.log('🔧 Next Steps:');
        console.log(`1. Add this to your .env file:`);
        console.log(`   TWELVELABS_INDEX_ID=${parsed.id}`);
        console.log('2. Upload and index your video clips');
        console.log('3. Test search functionality');
        
        // Write to a file for easy reference
        const fs = require('fs');
        fs.writeFileSync('new-index-id.txt', parsed.id);
        console.log('📝 Index ID saved to: new-index-id.txt');
        
      } else {
        console.log('❌ Failed to create index');
        console.log('Response:', parsed);
      }
    } catch (e) {
      console.log('❌ Failed to parse response:');
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Request failed:', e.message);
});

req.setTimeout(30000, () => {
  console.log('❌ Request timeout after 30 seconds');
  req.destroy();
});

req.write(indexData);
req.end();