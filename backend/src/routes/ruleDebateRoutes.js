import express from 'express'
import { createRuleDebate, getRuleDebates, joinRuleDebate, createRuleDebateSpeech, voteRuleDebate, settleRuleDebate } from '../controllers/ruleDebateController.js'
import { auth } from '../middlewares/auth.js'
import { aiAudit } from '../middlewares/aiAudit.js'
import { requireAdmin } from '../middlewares/permission.js'

const router = express.Router()

router.get('/', getRuleDebates)
router.post('/', auth, requireAdmin, createRuleDebate)
router.post('/:debateId/join', auth, joinRuleDebate)
router.post('/:debateId/speeches', auth, aiAudit('content', 'speech'), createRuleDebateSpeech)
router.post('/:debateId/vote', auth, voteRuleDebate)
router.post('/:debateId/settle', auth, requireAdmin, settleRuleDebate)

export default router
