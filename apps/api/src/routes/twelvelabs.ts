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
      // In demo mode, return sample clips for common queries
      const sampleClips = [
        {
          title: "Anthony Edwards • Injury Update",
          start: 120,
          end: 135,
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          snippet: "Edwards walking gingerly after the collision, but stays in the game"
        },
        {
          title: "Clutch Three • Game Winner",
          start: 45,
          end: 58,
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          snippet: "Edwards drains the clutch three-pointer with 2.1 seconds left"
        }
      ]
      return res.json({ clips: q.toLowerCase().includes('injury') || q.toLowerCase().includes('edwards') ? sampleClips : [] , meta: { source: 'demo' } })
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
