import express from 'express'
import { createReport, reviewReport, getPendingReports } from '../controllers/reportController.js'
import { auth } from '../middlewares/auth.js'
import { requireAdmin } from '../middlewares/permission.js'

const router = express.Router()

router.post('/', auth, createReport)
router.get('/pending', auth, requireAdmin, getPendingReports)
router.put('/:reportId/review', auth, requireAdmin, reviewReport)

export default router
