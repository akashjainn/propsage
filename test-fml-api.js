// Test script for FML API endpoints
const BASE_URL = 'http://localhost:4000'

// Test data - sample NBA player prop
const testMarket = {
  player_id: "giannis_antetokounmpo",
  player_name: "Giannis Antetokounmpo",
  market: "points",
  event_id: "test_game_001",
  books: [
    {
      book: "DraftKings",
      line: 30.5,
      over_price: -110,
      under_price: -110
    },
    {
      book: "FanDuel", 
      line: 31.0,
      over_price: -105,
      under_price: -115
    },
    {
      book: "BetMGM",
      line: 30.5,
      over_price: -115,
      under_price: -105
    },
    {
      book: "Caesars",
      line: 31.5,
      over_price: -120,
      under_price: +100
    }
  ]
}

async function testFMLEndpoints() {
  console.log('🚀 Testing PropSage FML API endpoints...\n')

  try {
    // Test health endpoint
    console.log('1. Testing /fml/health')
    const healthResponse = await fetch(`${BASE_URL}/fml/health`)
    const healthData = await healthResponse.json()
    console.log('✅ Health:', healthData)
    console.log('')

    // Test analyze endpoint
    console.log('2. Testing /fml/analyze')
    const analyzeResponse = await fetch(`${BASE_URL}/fml/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMarket)
    })
    const analyzeData = await analyzeResponse.json()
    console.log('✅ Analysis Result:')
    console.log(`   Player: ${analyzeData.player_name}`)
    console.log(`   Market: ${analyzeData.market}`)
    console.log(`   Fair Market Line: ${analyzeData.fair_market_line}`)
    console.log(`   Confidence: ${analyzeData.confidence}`)
    console.log(`   Books Analyzed: ${analyzeData.books_analyzed}`)
    console.log(`   Edges Found: ${analyzeData.edges.length}`)
    
    if (analyzeData.edges.length > 0) {
      console.log('   Top Edge:')
      const topEdge = analyzeData.edges[0]
      console.log(`     - ${topEdge.book} ${topEdge.side} ${topEdge.line} @ ${topEdge.price}`)
      console.log(`     - Edge: ${topEdge.edge_percent.toFixed(2)}%`)
      console.log(`     - Kelly: ${topEdge.kelly_fraction.toFixed(3)}`)
    }
    console.log('')

    // Test batch endpoint
    console.log('3. Testing /fml/batch')
    const batchMarkets = [
      testMarket,
      {
        ...testMarket,
        player_id: "jayson_tatum",
        player_name: "Jayson Tatum",
        market: "rebounds",
        books: testMarket.books.map(book => ({
          ...book,
          line: book.line - 22, // Adjust for rebounds
        }))
      }
    ]

    const batchResponse = await fetch(`${BASE_URL}/fml/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markets: batchMarkets })
    })
    const batchData = await batchResponse.json()
    console.log('✅ Batch Analysis:')
    console.log(`   Markets Analyzed: ${batchData.markets_analyzed}`)
    console.log(`   Average Confidence: ${batchData.avg_confidence?.toFixed(2)}`)
    console.log(`   Total Edges Found: ${batchData.total_edges_found}`)
    console.log('')

    // Test edges endpoint
    console.log('4. Testing /fml/edges')
    const edgesResponse = await fetch(`${BASE_URL}/fml/edges?min_edge=2&limit=5`)
    const edgesData = await edgesResponse.json()
    console.log('✅ Best Edges:')
    console.log(`   Total Found: ${edgesData.total_edges_found}`)
    console.log(`   Returned: ${edgesData.edges_returned}`)
    console.log('')

    // Test cache clear
    console.log('5. Testing /fml/cache')
    const cacheResponse = await fetch(`${BASE_URL}/fml/cache`, {
      method: 'DELETE'
    })
    const cacheData = await cacheResponse.json()
    console.log('✅ Cache Clear:', cacheData)
    console.log('')

    console.log('🎉 All FML API tests completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run tests if API is running
testFMLEndpoints()