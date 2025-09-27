import { Router } from 'express'
import { getProps } from '../services/demoCache.js'
import { oddsApiService } from '../services/oddsApi.js'
import { config } from '../config.js'

const router = Router()

// Cache for live odds (avoid hitting API on every request)
let liveOddsCache: any[] = []
let lastFetch = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

router.get('/', async (_req, res, next) => {
  try {
    let data = getProps() // Start with demo data

    // Try to get live odds if API key is available and cache is stale
    if (config.oddsApiKey && (Date.now() - lastFetch > CACHE_DURATION)) {
      console.log('🔄 Fetching fresh odds from TheOddsApi...')
      const liveOdds = await oddsApiService.fetchNBAPlayerProps()
      
      if (liveOdds.length > 0) {
        liveOddsCache = liveOdds
        lastFetch = Date.now()
        data = liveOdds
        console.log(`✅ Using ${liveOdds.length} live odds`)
      } else {
        console.log('⚠️  No live odds available, using demo data')
      }
    } else if (liveOddsCache.length > 0) {
      // Use cached live odds
      data = liveOddsCache
      console.log(`📋 Using cached live odds (${liveOddsCache.length} lines)`)
    }

    // Add usage stats to response
    const stats = oddsApiService.getUsageStats()
    res.json({
      lines: data,
      meta: {
        source: liveOddsCache.length > 0 ? 'live' : 'demo',
        count: data.length,
        lastUpdate: new Date(lastFetch).toISOString(),
        oddsApiUsage: stats
      }
    })

  } catch (err) {
    console.error('❌ Error in lines route:', err)
    // Fallback to demo data on error
    res.json({
      lines: getProps(),
      meta: {
        source: 'demo',
        error: 'Failed to fetch live odds'
      }
    })
  }
})

// Endpoint to force refresh odds (useful for testing)
router.post('/refresh', async (_req, res, next) => {
  try {
    if (!config.oddsApiKey) {
      return res.status(400).json({ error: 'No Odds API key configured' })
    }

    console.log('🔄 Force refreshing odds...')
    const liveOdds = await oddsApiService.fetchNBAPlayerProps()
    
    if (liveOdds.length > 0) {
      liveOddsCache = liveOdds
      lastFetch = Date.now()
    }

    const stats = oddsApiService.getUsageStats()
    res.json({
      success: true,
      count: liveOdds.length,
      usage: stats
    })

  } catch (err) {
    next(err)
  }
})

export default router
