import { Router } from 'express'
import { searchEvidence } from '../services/perplexity.js'

const router = Router()

router.get('/:playerId', async (req, res, next) => {
  try {
    const { playerId } = req.params
    const name = req.query.name?.toString() || playerId
    const evidence = await searchEvidence(playerId, name)
    res.json(evidence)
  } catch (err) { next(err) }
})

export default router
