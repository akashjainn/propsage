import { Router } from 'express'
import { findSimilarClips, videoIntelligenceService } from '../services/twelvelabs.js'
import { config } from '../config.js'

const router = Router()

// GET /video/search?q=Anthony Edwards injury
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q as string || '').trim()
    if (!q) return res.json({ clips: [] })

    if (config.demoMode) {
      // In demo mode, we cannot perform semantic search reliably - return empty
      return res.json({ clips: [] , meta: { source: 'demo' } })
    }
    if (!config.twelveLabsKey) return res.status(400).json({ error: 'twelvelabs_not_configured' })
    const signals = await videoIntelligenceService.searchVideoIntelligence([q])
    const clips: any[] = []
    signals.forEach(sig => {
      sig.evidence.forEach(ev => {
        clips.push({
          title: `${sig.signal_type.replace('_',' ')} • ${sig.entity_id}`,
          start: ev.start_time,
            end: ev.end_time,
            videoUrl: `https://twelvelabs.io/video/${ev.video_id}`,
            snippet: ev.description
        })
      })
    })
    res.json({ clips, meta: { count: clips.length, source: 'live' } })
  } catch (err) { next(err) }
})

router.get('/:playerId', async (req, res, next) => {
  try {
    const { playerId } = req.params
    const name = req.query.name?.toString() || playerId
    const clips = await findSimilarClips(playerId, name)
    res.json(clips)
  } catch (err) { next(err) }
})

export default router
