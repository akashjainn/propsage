import { Router } from 'express'
import { computeFairline } from '../services/fairline.js'

const router = Router()

router.post('/', (req, res) => {
  const { player_id, market, line } = req.body || {}
  if (!player_id || !market || typeof line !== 'number') {
    return res.status(400).json({ error: 'invalid_request' })
  }
  const result = computeFairline({ player_id, market, line })
  if (!result) return res.status(404).json({ error: 'prior_not_found' })
  res.json(result)
})

export default router
