import { Router } from 'express'
import { videoIntelligentFMLService } from '../services/videoIntelligentFML.js'
import type { PropMarket } from '../services/videoIntelligentFML.js'

const router = Router()

/**
 * POST /fml/enhanced - Calculate FML with video intelligence
 * Body: PropMarket object with player, market, and book data
 */
router.post('/enhanced', async (req, res, next) => {
  try {
    const market: PropMarket = req.body
    
    // Validate required fields
    if (!market.player_id || !market.player_name || !market.market || !market.books) {
      return res.status(400).json({
        error: 'Missing required fields: player_id, player_name, market, books'
      })
    }

    if (!Array.isArray(market.books) || market.books.length === 0) {
      return res.status(400).json({
        error: 'At least one book is required'
      })
    }

    console.log(`📊 Calculating video-enhanced FML for ${market.player_name} ${market.market}`)
    
    // Enhance market with video intelligence
    const enhancedMarket = await videoIntelligentFMLService.enhanceMarketWithVideo(market)
    
    res.json({
      success: true,
      market: enhancedMarket,
      video_intelligence: {
        signals_found: enhancedMarket.video_signals?.length || 0,
        adjustments_applied: enhancedMarket.video_adjustments,
        confidence: enhancedMarket.video_adjustments?.confidence || 0
      },
      usage_stats: videoIntelligentFMLService.getUsageStats()
    })
    
  } catch (error) {
    console.error('❌ Error in enhanced FML calculation:', error)
    next(error)
  }
})

/**
 * GET /fml/enhanced/:playerId/:market - Get enhanced FML for specific player/market
 */
router.get('/enhanced/:playerId/:market', async (req, res, next) => {
  try {
    const { playerId, market } = req.params
    const playerName = req.query.name?.toString() || playerId
    const sport = req.query.sport?.toString() || 'basketball'
    
    // Create a sample market for demonstration
    const sampleMarket: PropMarket = {
      player_id: playerId,
      player_name: playerName,
      market: market,
      sport: sport,
      event_id: `demo-${Date.now()}`,
      books: [
        {
          book: 'fanduel',
          line: 25.5,
          over_price: -110,
          under_price: -110,
          timestamp: new Date().toISOString()
        },
        {
          book: 'draftkings', 
          line: 25.5,
          over_price: -105,
          under_price: -115,
          timestamp: new Date().toISOString()
        }
      ],
      features: {
        usage_rate: 0.28,
        minutes_projected: 35,
        opponent_drtg: 110.5,
        pace: 102.3,
        home_advantage: true,
        rest_days: 1
      }
    }
    
    const enhancedMarket = await videoIntelligentFMLService.enhanceMarketWithVideo(sampleMarket)
    
    res.json(enhancedMarket)
    
  } catch (error) {
    console.error('❌ Error in enhanced FML lookup:', error)
    next(error)
  }
})

/**
 * POST /fml/video-digest - Run video intelligence digest for upcoming games
 */
router.post('/video-digest', async (req, res, next) => {
  try {
    const { league = 'NBA-2025', players = [] } = req.body
    
    console.log(`🎬 Running video intelligence digest for ${league}`)
    
    // If specific players provided, search for them
    let results = []
    
    if (players.length > 0) {
      for (const playerName of players) {
        try {
          const sampleMarket: PropMarket = {
            player_id: playerName.toLowerCase().replace(' ', '_'),
            player_name: playerName,
            market: 'points',
            sport: league.includes('NBA') ? 'basketball' : 'football',
            event_id: `digest-${Date.now()}`,
            books: [],
            features: {}
          }
          
          const enhanced = await videoIntelligentFMLService.enhanceMarketWithVideo(sampleMarket)
          results.push({
            player: playerName,
            signals: enhanced.video_signals?.length || 0,
            adjustments: enhanced.video_adjustments
          })
        } catch (error) {
          console.error(`Error processing ${playerName}:`, error)
        }
      }
    } else {
      // Run general digest for common players
      const commonPlayers = ['Luka Doncic', 'Jayson Tatum', 'Anthony Edwards', 'Shai Gilgeous-Alexander']
      
      for (const playerName of commonPlayers) {
        try {
          const sampleMarket: PropMarket = {
            player_id: playerName.toLowerCase().replace(' ', '_'),
            player_name: playerName,
            market: 'points',
            sport: 'basketball',
            event_id: `digest-${Date.now()}`,
            books: [],
            features: {}
          }
          
          const enhanced = await videoIntelligentFMLService.enhanceMarketWithVideo(sampleMarket)
          results.push({
            player: playerName,
            signals: enhanced.video_signals?.length || 0,
            adjustments: enhanced.video_adjustments
          })
        } catch (error) {
          console.error(`Error processing ${playerName}:`, error)
        }
      }
    }
    
    res.json({
      success: true,
      league,
      players_processed: results.length,
      results,
      usage_stats: videoIntelligentFMLService.getUsageStats()
    })
    
  } catch (error) {
    console.error('❌ Error in video digest:', error)
    next(error)
  }
})

export default router