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
  getStats,
  getAdminPosts,
  managePost,
  getAdminComments,
  manageComment,
  getAIConfig,
  updateAIConfig,
  getAIStats,
  getAILogs,
  getSensitiveWords,
  addSensitiveWord,
  updateSensitiveWord,
  deleteSensitiveWord
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

// 社区管理
router.get('/posts', getAdminPosts)
router.put('/posts/:postId', managePost)
router.get('/comments', getAdminComments)
router.delete('/comments/:commentId', manageComment)

// AI审核管理
router.get('/ai/config', getAIConfig)
router.put('/ai/config', updateAIConfig)
router.get('/ai/stats', getAIStats)
router.get('/ai/logs', getAILogs)

// 敏感词管理
router.get('/sensitive-words', getSensitiveWords)
router.post('/sensitive-words', addSensitiveWord)
router.put('/sensitive-words/:id', updateSensitiveWord)
router.delete('/sensitive-words/:id', deleteSensitiveWord)

export default router
