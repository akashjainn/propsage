import { Router } from 'express'
import { findSimilarClips } from '../services/twelvelabs.js'

const router = Router()

router.get('/:playerId', async (req, res, next) => {
  try {
    const { playerId } = req.params
    const name = req.query.name?.toString() || playerId
    const clips = await findSimilarClips(playerId, name)
    res.json(clips)
  } catch (err) { next(err) }
})

export default router
