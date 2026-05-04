import express from 'express'
import { submitScore, getScoreResult } from '../controllers/scoreController.js'
import { auth } from '../middlewares/auth.js'

const router = express.Router()
router.post('/topics/:topicId/score', auth, submitScore)
router.get('/topics/:topicId/score-result', getScoreResult)
export default router
