// Quick test script for PropSage API connectivity
const RAILWAY_URL = 'https://worthy-charisma-production.up.railway.app';

async function testAPI() {
  console.log('🧪 Testing PropSage API connectivity...\n');
  
  const endpoints = [
    { name: 'Root', path: '' },
    { name: 'Health', path: '/health' },
    { name: 'Lines', path: '/lines' },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}: ${RAILWAY_URL}${endpoint.path}`);
      const response = await fetch(`${RAILWAY_URL}${endpoint.path}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name}: ${response.status}`, data);
      } else {
        console.log(`❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
    console.log('');
  }
}

testAPI();