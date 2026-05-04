import express from 'express'
import { auth } from '../middlewares/auth.js'
import { requireAdmin } from '../middlewares/permission.js'
import {
  punishUser,
  restoreUser,
  searchUsers,
  getUserDetail,
  getPendingTopics,
  reviewTopic,
  getAIErrors,
  submitAIOptimization,
  getStats
} from '../controllers/adminController.js'
import { getRules, saveRule } from '../controllers/ruleController.js'
import { createRuleDebate } from '../controllers/ruleDebateController.js'

const router = express.Router()

router.use(auth)
router.use(requireAdmin)

router.post('/punish', punishUser)
router.post('/restore', restoreUser)
router.get('/users/search', searchUsers)
router.get('/users/:userId', getUserDetail)
router.get('/topics/pending', getPendingTopics)
router.post('/topics/review', reviewTopic)
router.get('/ai/errors', getAIErrors)
router.post('/ai/optimize', submitAIOptimization)
router.get('/rules', getRules)
router.post('/rules', saveRule)
router.post('/rule-debates', createRuleDebate)
router.get('/stats', getStats)

export default router
