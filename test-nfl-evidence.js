/**
 * Test NFL Evidence Service
 * 
 * This script tests the NFL evidence service against your Week 5 highlights
 */

const fetch = require('node-fetch');
const FormData = require('form-data');

// Configuration
const API_KEY = process.env.TWELVELABS_API_KEY || 'tlk_3YN6ZF80FS8KBA2VWEZWF0SMM457';
const INDEX_ID = process.env.TWELVELABS_INDEX_ID || '68d845e918ca9db9c9ddbe3b';
const BASE_URL = 'https://api.twelvelabs.io/v1.3';

// NFL Test Queries for Week 5
const NFL_TEST_QUERIES = [
  // Touchdown queries
  'rushing touchdown red zone',
  'passing touchdown end zone',
  'touchdown run goal line',
  
  // Big play queries  
  'explosive run 20+ yards',
  'deep pass touchdown',
  'breakaway run touchdown',
  
  // Situational queries
  'fourth quarter drive',
  'two minute drill',
  'red zone attempt',
  'third down conversion',
  
  // Player-specific (examples)
  'Lamar Jackson rushing touchdown',
  'Josh Allen passing touchdown',
  'Christian McCaffrey rushing attempt',
  'Tyreek Hill reception'
];

async function testTwelveLabsSearch(query) {
  console.log(`\n🔍 Testing query: "${query}"`);
  
  try {
    const formData = new FormData();
    formData.append('query_text', query);
    formData.append('index_id', INDEX_ID);
    formData.append('search_options', 'visual');
    formData.append('search_options', 'audio');
    formData.append('sort_option', 'score');
    formData.append('page_limit', '5');

    const response = await fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const result = await response.json();
    const hits = result.data || [];

    console.log(`  ✅ Found ${hits.length} results`);
    
    if (hits.length > 0) {
      const topHit = hits[0];
      console.log(`  🏆 Top result: ${topHit.score}% confidence`);
      console.log(`     Video: ${topHit.video_id}`);
      console.log(`     Time: ${topHit.start}s - ${topHit.end}s`);
      
      if (topHit.transcription) {
        const transcript = topHit.transcription.substring(0, 100);
        console.log(`     Text: "${transcript}..."`);
      }
      
      return {
        query,
        success: true,
        count: hits.length,
        topScore: topHit.score,
        topResult: topHit
      };
    } else {
      console.log('  ⚠️  No results found');
      return {
        query,
        success: true,
        count: 0
      };
    }

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return {
      query,
      success: false,
      error: error.message
    };
  }
}

async function testNFLEvidenceQueries() {
  console.log('🏈 Testing NFL Evidence Queries for Week 5 Highlights');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const query of NFL_TEST_QUERIES) {
    const result = await testTwelveLabsSearch(query);
    results.push(result);
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(30));
  
  const successful = results.filter(r => r.success);
  const withResults = results.filter(r => r.count > 0);
  const avgScore = withResults.length > 0 
    ? withResults.reduce((sum, r) => sum + (r.topScore || 0), 0) / withResults.length
    : 0;
  
  console.log(`Total queries: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`With results: ${withResults.length}`);
  console.log(`Average top score: ${avgScore.toFixed(1)}%`);
  
  // Top performers
  const topQueries = withResults
    .sort((a, b) => (b.topScore || 0) - (a.topScore || 0))
    .slice(0, 5);
    
  console.log('\n🏆 Top Performing Queries:');
  topQueries.forEach((result, i) => {
    console.log(`  ${i + 1}. "${result.query}" - ${result.topScore}% (${result.count} results)`);
  });
  
  // Failed queries
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('\n❌ Failed Queries:');
    failed.forEach(result => {
      console.log(`  - "${result.query}": ${result.error}`);
    });
  }
  
  console.log('\n✅ NFL Evidence Service test complete!');
  return results;
}

// PropSage integration test
async function testPropSageIntegration() {
  console.log('\n🔗 Testing PropSage API Integration');
  console.log('='.repeat(40));
  
  const BASE_API = 'http://localhost:4000';
  
  // Test health endpoint
  try {
    console.log('Testing /nfl/evidence/health...');
    const healthResponse = await fetch(`${BASE_API}/nfl/evidence/health`);
    const health = await healthResponse.json();
    console.log('✅ Health check:', health);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('💡 Make sure to start the API with: pnpm dev:api');
    return;
  }
  
  // Test patterns endpoint
  try {
    console.log('\nTesting /nfl/evidence/patterns...');
    const patternsResponse = await fetch(`${BASE_API}/nfl/evidence/patterns`);
    const patterns = await patternsResponse.json();
    console.log('✅ Available patterns:', patterns.propTypes);
  } catch (error) {
    console.log('❌ Patterns test failed:', error.message);
  }
  
  // Test search endpoint
  try {
    console.log('\nTesting /nfl/evidence/search...');
    const searchResponse = await fetch(`${BASE_API}/nfl/evidence/search?q=touchdown&limit=3`);
    const search = await searchResponse.json();
    console.log(`✅ Search results: ${search.totalResults} clips found`);
    
    if (search.evidence.length > 0) {
      const clip = search.evidence[0];
      console.log(`   Top clip: ${clip.confidence.toFixed(2)} confidence, ${clip.tags.join(', ')}`);
    }
  } catch (error) {
    console.log('❌ Search test failed:', error.message);
  }
}

// Main execution
async function main() {
  if (!API_KEY || !INDEX_ID) {
    console.error('❌ Missing TwelveLabs configuration!');
    console.error('Please set TWELVELABS_API_KEY and TWELVELABS_INDEX_ID environment variables');
    process.exit(1);
  }
  
  console.log('🚀 Starting NFL Evidence Service Tests');
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`Index ID: ${INDEX_ID}`);
  
  // Test TwelveLabs direct
  await testNFLEvidenceQueries();
  
  // Test PropSage API integration
  await testPropSageIntegration();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testTwelveLabsSearch,
  testNFLEvidenceQueries,
  NFL_TEST_QUERIES
};