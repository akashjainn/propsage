// Test the complete Evidence-Backed Props system
const API_BASE = process.env.API_URL || 'http://localhost:3001';

async function testEvidenceSystem() {
  console.log('🎬 Testing Evidence-Backed Props System\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Video Intelligence Health Check...');
    const healthResponse = await fetch(`${API_BASE}/cfb/evidence/health`);
    console.log(`Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log(`- Video Intelligence: ${health.videoIntelligence}`);
      console.log(`- Mock Videos: ${health.mockVideosCount}`);
      console.log(`- Features: momentPacks=${health.features.momentPacks}, search=${health.features.freeformSearch}`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 2: Demo Data
    console.log('2. Testing Demo Evidence Data...');
    const demoResponse = await fetch(`${API_BASE}/cfb/evidence/demo`);
    console.log(`Status: ${demoResponse.status}`);
    
    if (demoResponse.ok) {
      const demo = await demoResponse.json();
      console.log(`- Available: ${demo.available}`);
      console.log(`- Moment Pack: ${demo.momentPack ? demo.momentPack.moments.length : 0} moments`);
      console.log(`- Evidence: ${demo.evidence ? demo.evidence.summary.totalMoments : 0} total moments`);
      
      if (demo.evidence) {
        console.log(`- Features: ${demo.evidence.features.length} evidence features`);
        demo.evidence.features.forEach(feature => {
          console.log(`  • ${feature.name}: ${feature.value} ${feature.unit} (${feature.confidence})`);
        });
        
        if (demo.evidence.summary.supportFactors.length > 0) {
          console.log('- Supporting Evidence:');
          demo.evidence.summary.supportFactors.forEach(factor => {
            console.log(`  ✅ ${factor}`);
          });
        }
        
        if (demo.evidence.summary.riskFactors.length > 0) {
          console.log('- Risk Factors:');
          demo.evidence.summary.riskFactors.forEach(factor => {
            console.log(`  ⚠️ ${factor}`);
          });
        }
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 3: Prop Evidence
    console.log('3. Testing Prop Evidence...');
    const propId = 'prop_cfb_beck_pass_yds_dk';
    const evidenceResponse = await fetch(`${API_BASE}/cfb/evidence/prop/${propId}`);
    console.log(`Status: ${evidenceResponse.status}`);
    
    if (evidenceResponse.ok) {
      const evidence = await evidenceResponse.json();
      console.log(`- Prop: ${evidence.propInfo?.playerName} ${evidence.propInfo?.stat}`);
      console.log(`- Market: ${evidence.propInfo?.marketLine}, Fair: ${evidence.propInfo?.fairLine}`);
      console.log(`- Moment Packs: ${evidence.momentPacks?.length || 0}`);
      console.log(`- Total Moments: ${evidence.summary?.totalMoments || 0}`);
      console.log(`- Avg Confidence: ${Math.round((evidence.summary?.avgConfidence || 0) * 100)}%`);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 4: Moment Packs
    console.log('4. Testing Moment Packs...');
    const playerId = 'cfb_carson_beck';
    const propType = 'PASS_YDS';
    const momentResponse = await fetch(`${API_BASE}/cfb/evidence/moments/${playerId}/${propType}`);
    console.log(`Status: ${momentResponse.status}`);
    
    if (momentResponse.ok) {
      const momentPack = await momentResponse.json();
      console.log(`- Player: ${momentPack.playerInfo?.name}`);
      console.log(`- Prop Type: ${momentPack.propType}`);
      console.log(`- Moments: ${momentPack.moments?.length || 0}`);
      
      if (momentPack.moments && momentPack.moments.length > 0) {
        console.log('- Sample moments:');
        momentPack.moments.slice(0, 3).forEach((moment, i) => {
          console.log(`  ${i + 1}. "${moment.label}" (${moment.startTime}s-${moment.endTime}s, ${moment.confidence})`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 5: Ask the Tape
    console.log('5. Testing Ask the Tape (Free-form search)...');
    const searchResponse = await fetch(`${API_BASE}/cfb/evidence/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'quarterback throwing under pressure',
        playerName: 'Carson Beck',
        limit: 3
      })
    });
    console.log(`Status: ${searchResponse.status}`);
    
    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      console.log(`- Query: "${searchResults.query}"`);
      console.log(`- Results: ${searchResults.moments?.length || 0} moments`);
      console.log(`- Available: ${searchResults.available}`);
      
      if (searchResults.moments && searchResults.moments.length > 0) {
        console.log('- Found moments:');
        searchResults.moments.forEach((moment, i) => {
          console.log(`  ${i + 1}. "${moment.label}" (score: ${Math.round(moment.score * 100)}%)`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 6: Available Videos
    console.log('6. Testing Available Videos...');
    const videosResponse = await fetch(`${API_BASE}/cfb/evidence/videos`);
    console.log(`Status: ${videosResponse.status}`);
    
    if (videosResponse.ok) {
      const videos = await videosResponse.json();
      console.log(`- Total Videos: ${videos.total}`);
      
      videos.videos.forEach((video, i) => {
        console.log(`  ${i + 1}. "${video.title}"`);
        console.log(`     Teams: ${video.teams.join(' vs ')}`);
        console.log(`     Players: ${video.players.slice(0, 3).join(', ')}`);
        console.log(`     Status: ${video.status}`);
      });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Summary
    console.log('🎯 Evidence-Backed Props System Test Complete!');
    console.log('\nNext steps:');
    console.log('1. Add TwelveLabs API key to enable full video intelligence');
    console.log('2. Upload your S3 CFB highlight clips for indexing');
    console.log('3. Run Saturday night batch processing to build moment packs');
    console.log('4. Enable on Railway with environment variables:');
    console.log('   - CFBD_API_KEY (already have)');
    console.log('   - YOUTUBE_API_KEY (already have)');
    console.log('   - TWELVELABS_API_KEY (need to add)');
    console.log('   - TWELVELABS_INDEX_ID (need to add)');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Usage examples for the frontend
function frontendUsageExamples() {
  console.log('\n📱 Frontend Usage Examples:\n');
  
  console.log('1. Evidence Rail Component:');
  console.log(`
    <EvidenceRail 
      propId="prop_cfb_beck_pass_yds_dk"
      playerId="cfb_carson_beck"
      propType="PASS_YDS"
      onMomentClick={(moment) => setSelectedMoment(moment)}
      showAskTape={true}
    />
  `);
  
  console.log('2. Moment Player Component:');
  console.log(`
    {selectedMoment && (
      <MomentPlayer
        moment={selectedMoment}
        s3Url="https://your-bucket.s3.amazonaws.com/clip.mp4"
        onClose={() => setSelectedMoment(null)}
      />
    )}
  `);
  
  console.log('3. API Usage:');
  console.log(`
    // Get evidence for a prop
    const evidence = await fetch('/cfb/evidence/prop/prop_id').then(r => r.json());
    
    // Ask the tape search
    const moments = await fetch('/cfb/evidence/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'deep passes under pressure' })
    }).then(r => r.json());
  `);
}

// Run if called directly
if (require.main === module) {
  testEvidenceSystem().then(() => {
    frontendUsageExamples();
  });
}

module.exports = { testEvidenceSystem, frontendUsageExamples };