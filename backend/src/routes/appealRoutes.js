import express from 'express'
import { submitAppeal, reviewAppeal, getPendingAppeals } from '../controllers/appealController.js'
import { auth } from '../middlewares/auth.js'
import { requireAdmin } from '../middlewares/permission.js'

const router = express.Router()

router.post('/', auth, submitAppeal)
router.get('/pending', auth, requireAdmin, getPendingAppeals)
router.put('/:appealId/review', auth, requireAdmin, reviewAppeal)

export default router
