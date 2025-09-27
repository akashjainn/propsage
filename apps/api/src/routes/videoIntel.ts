import { Router } from 'express'
import { videoIntelligenceService } from '../services/twelvelabs.js'
import { config } from '../config.js'

const router = Router()

// Cache for video intelligence signals
let videoSignalsCache: any[] = []
let lastVideoDigest = 0
const VIDEO_CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

/**
 * GET /video-intel - Get video intelligence signals
 */
router.get('/', async (_req, res, next) => {
  try {
    let signals = []

    if (config.demoMode) {
      // Return demo video intelligence signals
      signals = getDemoVideoSignals()
    } else if (config.twelveLabsKey && (Date.now() - lastVideoDigest > VIDEO_CACHE_DURATION)) {
      console.log('🎬 Running fresh video intelligence digest...')
      signals = await videoIntelligenceService.runVideoIntelligenceDigest('NBA-2025')
      
      if (signals.length > 0) {
        videoSignalsCache = signals
        lastVideoDigest = Date.now()
        console.log(`✅ Generated ${signals.length} video intelligence signals`)
      } else {
        console.log('⚠️  No video signals found, using demo data')
        signals = getDemoVideoSignals()
      }
    } else if (videoSignalsCache.length > 0) {
      signals = videoSignalsCache
      console.log(`📋 Using cached video intelligence (${signals.length} signals)`)
    } else {
      signals = getDemoVideoSignals()
    }

    const stats = videoIntelligenceService.getUsageStats()
    res.json({
      signals,
      meta: {
        source: config.demoMode ? 'demo' : (videoSignalsCache.length > 0 ? 'live' : 'demo'),
        count: signals.length,
        lastUpdate: new Date(lastVideoDigest).toISOString(),
        twelveLabsUsage: stats
      }
    })

  } catch (err) {
    console.error('❌ Error in video intelligence route:', err)
    res.json({
      signals: getDemoVideoSignals(),
      meta: {
        source: 'demo',
        error: 'Failed to fetch video intelligence'
      }
    })
  }
})

/**
 * POST /video-intel/search - Search for specific video moments
 */
router.post('/search', async (req, res, next) => {
  try {
    const { query, league = 'NBA-2025' } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Query is required' })
    }

    if (config.demoMode) {
      return res.json({
        signals: getDemoVideoSignals().filter(s => 
          s.signal_type.includes(query.toLowerCase()) ||
          s.entity_id.includes(query.toLowerCase())
        ),
        meta: { source: 'demo' }
      })
    }

    if (!config.twelveLabsKey) {
      return res.status(400).json({ error: 'TwelveLabs API key not configured' })
    }

    console.log(`🔍 Searching video intelligence: "${query}" in ${league}`)
    const signals = await videoIntelligenceService.searchVideoIntelligence([query], league)
    
    const stats = videoIntelligenceService.getUsageStats()
    res.json({
      signals,
      meta: {
        source: 'live',
        query,
        league,
        count: signals.length,
        twelveLabsUsage: stats
      }
    })

  } catch (err) {
    next(err)
  }
})

/**
 * POST /video-intel/digest - Force refresh video intelligence digest
 */
router.post('/digest', async (req, res, next) => {
  try {
    const { league = 'NBA-2025' } = req.body

    if (!config.twelveLabsKey) {
      return res.status(400).json({ error: 'TwelveLabs API key not configured' })
    }

    console.log(`🔄 Force refreshing video intelligence digest for ${league}...`)
    const signals = await videoIntelligenceService.runVideoIntelligenceDigest(league)
    
    if (signals.length > 0) {
      videoSignalsCache = signals
      lastVideoDigest = Date.now()
    }

    const stats = videoIntelligenceService.getUsageStats()
    res.json({
      success: true,
      count: signals.length,
      league,
      usage: stats
    })

  } catch (err) {
    next(err)
  }
})

/**
 * POST /video-intel/setup - Initialize TwelveLabs indexes
 */
router.post('/setup', async (_req, res, next) => {
  try {
    if (!config.twelveLabsKey) {
      return res.status(400).json({ error: 'TwelveLabs API key not configured' })
    }

    console.log('🏗️  Setting up TwelveLabs video intelligence indexes...')
    await videoIntelligenceService.createVideoIntelligenceIndexes()
    
    const stats = videoIntelligenceService.getUsageStats()
    res.json({
      success: true,
      message: 'Video intelligence indexes created successfully',
      usage: stats
    })

  } catch (err) {
    next(err)
  }
})

/**
 * Demo video intelligence signals for development
 */
function getDemoVideoSignals() {
  return [
    {
      entity_type: 'player',
      entity_id: 'anthony-edwards',
      event_id: 'MIN-vs-LAL-2025-01-15',
      timestamp: new Date().toISOString(),
      signal_type: 'injury',
      value: 0.3,
      confidence: 0.75,
      evidence: [{
        video_id: 'demo-video-1',
        start_time: 120,
        end_time: 135,
        description: 'Edwards limping slightly after collision, walked off under own power',
        source: 'twelvelabs'
      }]
    },
    {
      entity_type: 'player',
      entity_id: 'luka-doncic',
      event_id: 'DAL-vs-BOS-2025-01-16',
      timestamp: new Date().toISOString(),
      signal_type: 'minutes_restriction',
      value: 0.6,
      confidence: 0.85,
      evidence: [{
        video_id: 'demo-video-2',
        start_time: 45,
        end_time: 62,
        description: 'Coach Kidd mentions "managing Luka\'s minutes" in pregame interview',
        source: 'twelvelabs'
      }]
    },
    {
      entity_type: 'game',
      entity_id: 'CHI-vs-MIL-2025-01-17',
      event_id: 'CHI-vs-MIL-2025-01-17',
      timestamp: new Date().toISOString(),
      signal_type: 'weather',
      value: 0.7,
      confidence: 0.9,
      evidence: [{
        video_id: 'demo-video-3',
        start_time: 0,
        end_time: 30,
        description: 'Heavy snow visible outside arena, reports of slippery conditions affecting travel',
        source: 'twelvelabs'
      }]
    },
    {
      entity_type: 'player',
      entity_id: 'jayson-tatum',
      event_id: 'BOS-vs-PHI-2025-01-18',
      timestamp: new Date().toISOString(),
      signal_type: 'coach_comment',
      value: 0.8,
      confidence: 0.95,
      evidence: [{
        video_id: 'demo-video-4',
        start_time: 180,
        end_time: 195,
        description: 'Mazzulla: "Jayson is feeling great, expect him to be aggressive tonight"',
        source: 'twelvelabs'
      }]
    }
  ]
}

export default router