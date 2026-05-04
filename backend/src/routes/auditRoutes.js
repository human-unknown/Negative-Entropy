import express from 'express'
import { aiAuditService } from '../middlewares/aiAudit.js'
import { success, error } from '../utils/response.js'

const router = express.Router()

/**
 * 内容预检 - 快速审核内容是否合规
 * POST /api/audit/precheck
 * Body: { content, type: 'speech' | 'topic' | 'username' }
 */
router.post('/precheck', async (req, res) => {
  try {
    const { content, type = 'speech' } = req.body

    if (!content) {
      return res.json(error('内容不能为空', 400))
    }

    if (!['speech', 'topic', 'username'].includes(type)) {
      return res.json(error('内容类型无效', 400))
    }

    const auditResult = await aiAuditService.auditContent(content, type)

    let status = 'safe'
    if (auditResult.result === 'reject') {
      status = 'blocked'
    } else if (auditResult.result === 'manual_review') {
      status = 'warning'
    }

    res.json(success({
      status,
      message: auditResult.reason || null,
      confidence: auditResult.confidence
    }))
  } catch (err) {
    console.error('内容预检失败:', err)
    res.json(error('内容检查服务异常', 500))
  }
})

export default router
