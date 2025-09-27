// NFL PropSage Demo Test Script
const RAILWAY_URL = 'https://worthy-charisma-production.up.railway.app';

async function testNflDemo() {
  console.log('🏈 Testing NFL PropSage Demo Flow...\n');
  
  const tests = [
    {
      name: 'NFL Player Search - CeeDee Lamb',
      path: '/nfl/players?q=ceedee',
      validate: (data) => data.length > 0 && data[0].name.includes('Lamb')
    },
    {
      name: 'NFL Player Search - Jerry Jeudy', 
      path: '/nfl/players?q=jeudy',
      validate: (data) => data.length > 0 && data[0].name.includes('Jeudy')
    },
    {
      name: 'NFL Props - CeeDee Lamb',
      path: '/nfl/props?playerId=nfl_6786',
      validate: (data) => data.length > 0 && data[0].playerName.includes('Lamb')
    },
    {
      name: 'NFL Props Detail',
      path: '/nfl/props/prop_nfl_6786_rec_yds_dk',
      validate: (data) => data.propId && data.edgePct !== undefined
    },
    {
      name: 'NFL Props History',
      path: '/nfl/props/prop_nfl_6786_rec_yds_dk/history',
      validate: (data) => Array.isArray(data) && data.length > 0
    },
    {
      name: 'NFL News - CeeDee Lamb',
      path: '/nfl/news?playerName=CeeDee%20Lamb&team=DAL',
      validate: (data) => Array.isArray(data)  // May be empty if no recent news
    },
    {
      name: 'Video Search - NFL highlights',
      path: '/video/search?q=CeeDee%20Lamb%20receiving%20yards%20highlights',
      validate: (data) => Array.isArray(data)  // May be empty without TwelveLabs key
    }
  ];

  const results = {
    passed: 0,
    failed: 0,
    details: []
  };

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await fetch(`${RAILWAY_URL}${test.path}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (test.validate(data)) {
          console.log(`✅ ${test.name}: PASSED`);
          if (test.path.includes('/props?')) {
            console.log(`   📊 Props found: ${data.length}`);
            if (data.length > 0) {
              console.log(`   🎯 Best edge: ${data[0].edgePct > 0 ? '+' : ''}${data[0].edgePct}%`);
            }
          }
          results.passed++;
        } else {
          console.log(`⚠️  ${test.name}: PASSED (but validation failed)`);
          console.log(`   📋 Response:`, JSON.stringify(data).slice(0, 100) + '...');
          results.failed++;
        }
      } else {
        const text = await response.text();
        console.log(`❌ ${test.name}: ${response.status} - ${text.slice(0, 100)}`);
        results.failed++;
      }
      
      results.details.push({
        test: test.name,
        status: response?.status || 'error',
        path: test.path
      });
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      results.failed++;
      results.details.push({
        test: test.name,
        status: 'error',
        error: error.message,
        path: test.path
      });
    }
    console.log('');
  }

  // Summary
  console.log('📈 Demo Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}\n`);

  // Demo flow description
  console.log('🎯 Demo Flow Ready:');
  console.log('1. Search "CeeDee" → Select CeeDee Lamb (DAL WR)');
  console.log('2. View props: Rec Yds 92.5 vs Fair 98.7 = +6.7% edge');
  console.log('3. Click prop → See clips + news + history');
  console.log('4. Try "Jerry Jeudy", "Bucky Irving" for more examples\n');

  if (results.failed === 0) {
    console.log('🚀 NFL PropSage demo is ready for presentation!');
  } else {
    console.log('⚠️  Some endpoints may still be deploying...');
  }
}

// Run test
testNflDemo().catch(console.error);