import express from 'express'
import LogicRouter from '../logic.js'

const router = express.Router()

router.get('/health', (_req, res) => res.json({ ok: true }))
router.use('/', LogicRouter)

export default router
