import { Router } from 'express'
import { getProps } from '../services/demoCache.js'

const router = Router()

router.get('/', (_req, res, next) => {
  try {
    const data = getProps()
    res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
