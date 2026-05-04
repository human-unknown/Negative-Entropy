import express from 'express'
import { getCategories, getTopics, createTopic, auditTopic, joinTopic, createSpeech, createAudienceSpeech, auditSpeech, closeTopic, voteTopic, settleTopic, searchTopics, getSpeeches, getTopicDetail, getTopicResult } from '../controllers/debateController.js'
import { auth } from '../middlewares/auth.js'
import { aiAuditBatch } from '../middlewares/aiAudit.js'
import { requireAdmin, requireLevel } from '../middlewares/permission.js'
import { USER_LEVEL } from '../constants/userLevel.js'

const router = express.Router()

router.get('/categories', getCategories)
router.get('/search', searchTopics)
router.get('/', getTopics)
router.get('/topics', getTopics)
router.get('/topics/:topicId', getTopicDetail)
router.get('/topics/:topicId/speeches', getSpeeches)
router.post('/topics', auth, requireLevel(USER_LEVEL.ADVANCED), aiAuditBatch([
  { field: 'title', type: 'topic' },
  { field: 'description', type: 'speech' }
]), createTopic)
router.put('/topics/:topicId/audit', auth, requireAdmin, auditTopic)
router.post('/topics/:topicId/join', auth, joinTopic)
router.post('/topics/:topicId/speeches', auth, createSpeech)
router.post('/topics/:topicId/audience-speeches', auth, createAudienceSpeech)
router.put('/speeches/:speechId/audit', auth, requireAdmin, auditSpeech)
router.put('/topics/:topicId/close', auth, closeTopic)
router.post('/topics/:topicId/vote', auth, voteTopic)
router.post('/topics/:topicId/settle', auth, settleTopic)
router.get('/topics/:topicId/result', getTopicResult)

export default router
