import { Router } from 'express'
import { findSimilarClips, videoIntelligenceService } from '../services/twelvelabs.js'
import { config } from '../config.js'
import fetch from 'node-fetch'

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
    
    // Use your specific index ID from environment
    const indexId = process.env.TWELVELABS_INDEX_ID || '68d777b79035da6ed75498e0'
    
    const response = await fetch(`https://api.twelvelabs.io/v1.3/search`, {
      method: 'POST',
      headers: {
        'x-api-key': config.twelveLabsKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        index_id: indexId,
        query: q,
        options: {
          return_segments: true,
          top_k: 8
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('TwelveLabs API error:', response.status, errorText)
      return res.status(response.status).json({ error: errorText })
    }

    const data = await response.json() as any
    console.log('TwelveLabs response:', JSON.stringify(data, null, 2))

    // Map to clips format expected by frontend
    const clips = (data?.data ?? []).flatMap((item: any) =>
      (item?.segments ?? []).map((s: any) => ({
        title: item?.metadata?.title ?? item?.video?.title ?? 'Video Clip',
        start: Math.max(0, Math.floor(s.start ?? 0)),
        end: Math.floor(s.end ?? (s.start ?? 0) + 10),
        videoUrl: item?.metadata?.video_url ?? item?.video?.url ?? item?.video?.hls?.url ?? '',
        snippet: s?.text ?? s?.description ?? 'Found relevant video segment'
      }))
    )

    res.json({ clips, meta: { count: clips.length, source: 'live', index_id: indexId } })
  } catch (err) { 
    console.error('Video search error:', err)
    next(err) 
  }
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
