import express from 'express'
import { createRuleDebate, getRuleDebates, getRuleDebateDetail, getRuleDebateSpeeches, getRuleDebateResult, joinRuleDebate, createRuleDebateSpeech, voteRuleDebate, settleRuleDebate } from '../controllers/ruleDebateController.js'
import { auth } from '../middlewares/auth.js'
import { aiAudit } from '../middlewares/aiAudit.js'
import { requireAdmin } from '../middlewares/permission.js'

const router = express.Router()

router.get('/', getRuleDebates)
router.get('/:debateId', getRuleDebateDetail)
router.get('/:debateId/speeches', getRuleDebateSpeeches)
router.get('/:debateId/result', getRuleDebateResult)
router.post('/', auth, requireAdmin, createRuleDebate)
router.post('/:debateId/join', auth, joinRuleDebate)
router.post('/:debateId/speeches', auth, aiAudit('content', 'speech'), createRuleDebateSpeech)
router.post('/:debateId/vote', auth, voteRuleDebate)
router.post('/:debateId/settle', auth, requireAdmin, settleRuleDebate)

export default router
