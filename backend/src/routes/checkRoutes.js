import express from 'express'
import { generateTest, submitTest, getDebateTopic, submitDebate, checkResult } from '../controllers/checkController.js'

const router = express.Router()

router.get('/logic-test', generateTest)
router.post('/logic-test', submitTest)
router.get('/debate-topic', getDebateTopic)
router.post('/debate', submitDebate)
router.get('/result/:userId', checkResult)

export default router
