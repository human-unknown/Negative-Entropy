import express from 'express'
import { submitFeedback } from '../controllers/feedbackController.js'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.post('/', auth, submitFeedback)

export default router
