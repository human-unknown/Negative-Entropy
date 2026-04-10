import express from 'express'
import { auth } from '../middlewares/auth.js'
import { requireAdmin } from '../middlewares/permission.js'
import {
  getReviewQueue,
  getReviewDetail,
  approveReview,
  rejectReview,
  batchReview
} from '../controllers/reviewController.js'

const router = express.Router()

// 所有复核接口需要管理员权限

// 获取待复核内容列表
router.get('/queue', auth, requireAdmin, getReviewQueue)

// 获取单个待复核内容详情
router.get('/:id', auth, requireAdmin, getReviewDetail)

// 通过复核
router.post('/:id/approve', auth, requireAdmin, approveReview)

// 驳回复核
router.post('/:id/reject', auth, requireAdmin, rejectReview)

// 批量处理复核
router.post('/batch', auth, requireAdmin, batchReview)

export default router
