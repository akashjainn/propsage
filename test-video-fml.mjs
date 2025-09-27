import express from 'express'
import { videoIntelligentFMLService } from '../services/videoIntelligentFML.js'

const app = express()
app.use(express.json())

// Test the video intelligence FML integration
async function testVideoIntelligentFML() {
  console.log('🧪 Testing Video Intelligence FML Integration...\n')

  // Test 1: Enhanced FML for Luka Doncic points
  const testMarket = {
    player_id: 'luka_doncic',
    player_name: 'Luka Doncic',
    market: 'points',
    sport: 'basketball',
    event_id: 'dal_vs_bos_20250127',
    books: [
      {
        book: 'fanduel',
        line: 32.5,
        over_price: -110,
        under_price: -110,
        timestamp: new Date().toISOString()
      },
      {
        book: 'draftkings',
        line: 32.5,
        over_price: -105,
        under_price: -115,
        timestamp: new Date().toISOString()
      },
      {
        book: 'betmgm',
        line: 33.5,
        over_price: -115,
        under_price: -105,
        timestamp: new Date().toISOString()
      }
    ],
    features: {
      usage_rate: 0.36,
      minutes_projected: 37,
      opponent_drtg: 112.4,
      pace: 98.7,
      home_advantage: true,
      rest_days: 1,
      spread: -7.5,
      total: 230.5,
      implied_team_total: 118.75
    }
  }

  try {
    console.log('📊 Processing market:', testMarket.player_name, testMarket.market)
    
    const enhanced = await videoIntelligentFMLService.enhanceMarketWithVideo(testMarket)
    
    console.log('✅ Enhanced Market Results:')
    console.log('- Player:', enhanced.player_name)
    console.log('- Market:', enhanced.market)
    console.log('- Video Signals Found:', enhanced.video_signals?.length || 0)
    
    if (enhanced.video_adjustments) {
      console.log('- Video Adjustments:')
      console.log('  • Injury Risk:', Math.round(enhanced.video_adjustments.injury_risk * 100) + '%')
      console.log('  • Minutes Risk:', Math.round(enhanced.video_adjustments.minutes_risk * 100) + '%')
      console.log('  • Weather Impact:', Math.round(enhanced.video_adjustments.weather_impact * 100) + '%')
      console.log('  • Role Change:', Math.round(enhanced.video_adjustments.role_change * 100) + '%')
      console.log('  • Confidence:', Math.round(enhanced.video_adjustments.confidence * 100) + '%')
    }

    if (enhanced.video_signals && enhanced.video_signals.length > 0) {
      console.log('- Top Video Signals:')
      enhanced.video_signals.slice(0, 3).forEach((signal, i) => {
        console.log(`  ${i + 1}. ${signal.signal_type} (${Math.round(signal.confidence * 100)}% confidence)`)
        if (signal.evidence.length > 0) {
          console.log(`     Evidence: ${signal.evidence[0].description}`)
        }
      })
    }

    console.log('- Enhanced Features:')
    console.log('  • Usage Rate:', enhanced.features.usage_rate)
    console.log('  • Minutes Projected:', enhanced.features.minutes_projected)
    console.log('  • Injury Probability:', enhanced.features.injury_probability)
    console.log('  • Minutes Restriction:', enhanced.features.minutes_restriction)
    console.log('  • Video Intelligence Confidence:', enhanced.features.video_intelligence_confidence)

    const usage = videoIntelligentFMLService.getUsageStats()
    console.log('- Usage Stats:')
    console.log('  • Video Searches:', usage.video_searches)
    console.log('  • Estimated Cost: $' + usage.estimated_video_cost?.toFixed(3))

    console.log('\n✅ Test completed successfully!')
    return enhanced

  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testVideoIntelligentFML()
    .then(() => {
      console.log('\n🎉 All tests passed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Tests failed:', error)
      process.exit(1)
    })
}

export { testVideoIntelligentFML }