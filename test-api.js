// PropSage API test script with TheOddsApi integration
const RAILWAY_URL = 'https://worthy-charisma-production.up.railway.app';

async function testAPI() {
  console.log('🧪 Testing PropSage API with TheOddsApi integration...\n');
  
  // Test basic endpoints
  const endpoints = [
    { name: 'Health', path: '/health' },
    { name: 'Lines (with Odds API)', path: '/lines' },
    { name: 'Video Intelligence', path: '/video-intel' },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}: ${RAILWAY_URL}${endpoint.path}`);
      const response = await fetch(`${RAILWAY_URL}${endpoint.path}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (endpoint.path === '/lines') {
          console.log(`✅ ${endpoint.name}: ${response.status}`);
          console.log(`   📊 Source: ${data.meta?.source || 'unknown'}`);
          console.log(`   📈 Lines: ${data.lines?.length || data.length} props`);
          if (data.meta?.oddsApiUsage) {
            console.log(`   🔧 API Usage: ${data.meta.oddsApiUsage.used}/${data.meta.oddsApiUsage.limit}`);
          }
        } else if (endpoint.path === '/video-intel') {
          console.log(`✅ ${endpoint.name}: ${response.status}`);
          console.log(`   🎬 Source: ${data.meta?.source || 'unknown'}`);
          console.log(`   📹 Signals: ${data.signals?.length || 0} intelligence signals`);
          if (data.meta?.twelveLabsUsage) {
            console.log(`   🔧 API Usage: ${data.meta.twelveLabsUsage.requests_used} calls, $${data.meta.twelveLabsUsage.estimated_cost.toFixed(3)}`);
          }
        } else {
          console.log(`✅ ${endpoint.name}: ${response.status}`, data);
        }
      } else {
        console.log(`❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
    console.log('');
  }

  // Test lines refresh endpoint
  try {
    console.log('Testing Lines Refresh (Force Update):');
    const response = await fetch(`${RAILWAY_URL}/lines/refresh`, {
      method: 'POST'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Refresh: ${response.status}`);
      console.log(`   🔄 Updated: ${data.count} props`);
      if (data.usage) {
        console.log(`   📊 API Usage: ${data.usage.used}/${data.usage.limit}`);
      }
    } else {
      const text = await response.text();
      console.log(`❌ Refresh: ${response.status} - ${text}`);
    }
  } catch (error) {
    console.log(`❌ Refresh: ${error.message}`);
  }
}

testAPI();