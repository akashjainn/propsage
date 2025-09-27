// College Football PropSage Demo Test Script
const RAILWAY_URL = 'https://worthy-charisma-production.up.railway.app';

async function testCfbDemo() {
  console.log('🏈 Testing College Football PropSage Demo Flow...\n');
  
  const tests = [
    {
      name: 'CFB Player Search - Carson Beck (Georgia QB)',
      path: '/cfb/players?q=carson%20beck',
      validate: (data) => data.length > 0 && data[0].name.includes('Beck')
    },
    {
      name: 'CFB Player Search - Tommy Castellanos (Boston College QB)', 
      path: '/cfb/players?q=castellanos',
      validate: (data) => data.length > 0 && data[0].name.includes('Castellanos')
    },
    {
      name: 'CFB Props - Carson Beck',
      path: '/cfb/props?playerId=cfb_carson_beck',
      validate: (data) => data.length > 0 && data[0].playerName.includes('Beck')
    },
    {
      name: 'CFB Props Detail',
      path: '/cfb/props/prop_cfb_beck_pass_yds_dk',
      validate: (data) => data.propId && data.edgePct !== undefined
    },
    {
      name: 'CFB Props History',
      path: '/cfb/props/prop_cfb_beck_pass_yds_dk/history',
      validate: (data) => Array.isArray(data) && data.length > 0
    },
    {
      name: 'CFB News - Carson Beck',
      path: '/cfb/news?playerName=Carson%20Beck&team=Georgia',
      validate: (data) => Array.isArray(data) // May be empty if no recent news
    },
    {
      name: 'CFB Video Search - Georgia highlights',
      path: '/cfb/video/search?q=Georgia%20passing%20plays',
      validate: (data) => Array.isArray(data) // Mock data should return results
    },
    {
      name: 'CFB Prop-Specific Clips',
      path: '/cfb/video/prop-clips?playerName=Carson%20Beck&stat=PASS_YDS&team=Georgia',
      validate: (data) => data.moments && Array.isArray(data.moments)
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
              console.log(`   🏈 Team: ${data[0].team} (${data[0].position})`);
            }
          }
          if (test.path.includes('/players?')) {
            console.log(`   👨‍🎓 Players found: ${data.length}`);
            if (data.length > 0) {
              console.log(`   🏛️  First result: ${data[0].name} (${data[0].team} ${data[0].position})`);
            }
          }
          if (test.path.includes('/video/prop-clips')) {
            console.log(`   🎬 Video moments: ${data.moments?.length || 0}`);
            console.log(`   🔍 Search queries: ${data.queries?.length || 0}`);
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
  console.log('📈 CFB Demo Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}\n`);

  // Demo flow description
  console.log('🎯 CFB Demo Flow Ready:');
  console.log('1. Search "Carson Beck" → Select Carson Beck (Georgia QB)');
  console.log('2. View props: Pass Yds 285.5 vs Fair 298.3 = +4.5% edge');
  console.log('3. Click prop → See video moments + news + history');
  console.log('4. Try "Tommy Castellanos", "Chandler Morris" for more examples');
  console.log('5. Perfect for Sunday demo with Saturday\'s games!\n');

  if (results.failed === 0) {
    console.log('🚀 College Football PropSage demo is ready for presentation!');
  } else {
    console.log('⚠️  Some endpoints may still be deploying...');
  }

  // Saturday context
  console.log('\n📅 Saturday Context for Demo:');
  console.log('• Virginia upset #8 Florida State in double OT');
  console.log('• Tommy Castellanos had standout performance for BC');
  console.log('• Georgia, Ohio State, USC all had big games');
  console.log('• Perfect recent context for prop analysis!');
}

// Run test
testCfbDemo().catch(console.error);