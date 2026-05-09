import { error } from '../utils/response.js'
import { autoEscalateViolation } from '../utils/violation.js'
import { aiAuditService, AuditResult } from '../services/aiAuditService.js'

// 重导出，保持 auditRoutes.js 兼容
export { aiAuditService, AuditResult }

/**
 * AI审核中间件 — 审核单个字段
 *
 * @param {string} fieldName  - 要审核的字段名（req.body[fieldName]）
 * @param {string} contentType - 内容类型: 'speech'|'topic'|'username'|'post_title'|'post_content'|'comment'
 */
export const aiAudit = (fieldName, contentType) => {
  return async (req, res, next) => {
    try {
      const content = req.body[fieldName]
      if (!content) {
        return res.status(400).json(error(`缺少必需字段: ${fieldName}`, 400))
      }

      const auditResult = await aiAuditService.auditContent(content, contentType)
      req.auditResult = auditResult

      if (auditResult.result === AuditResult.REJECT) {
        if (req.user?.userId) {
          autoEscalateViolation(req.user.userId, `${contentType}_rejected`, content).catch(err =>
            console.error('记录违规失败:', err)
          )
        }
        return res.status(400).json(
          error(`内容审核未通过: ${auditResult.reason}`, 400, { auditResult, punished: true })
        )
      }

      if (auditResult.result === AuditResult.MANUAL_REVIEW) {
        req.needsManualReview = true
      }

      next()
    } catch (err) {
      console.error('AI审核中间件错误:', err)
      res.status(500).json(error('内容审核服务异常，请稍后重试', 500))
    }
  }
}

/**
 * 批量AI审核中间件 — 同时审核多个字段
 *
 * @param {Array<{field: string, type: string}>} fields
 */
export const aiAuditBatch = (fields) => {
  return async (req, res, next) => {
    try {
      const auditResults = {}

      for (const { field, type } of fields) {
        const content = req.body[field]
        if (!content) {
          return res.status(400).json(error(`缺少必需字段: ${field}`, 400))
        }

        const result = await aiAuditService.auditContent(content, type)
        auditResults[field] = result

        if (result.result === AuditResult.REJECT) {
          if (req.user?.userId) {
            autoEscalateViolation(req.user.userId, `${field}_rejected`, content).catch(err =>
              console.error('记录违规失败:', err)
            )
          }
          return res.status(400).json(
            error(`内容审核未通过: ${result.reason}`, 400, { auditResults, punished: true })
          )
        }

        if (result.result === AuditResult.MANUAL_REVIEW) {
          req.needsManualReview = true
        }
      }

      req.auditResults = auditResults
      next()
    } catch (err) {
      console.error('批量AI审核中间件错误:', err)
      res.status(500).json(error('内容审核服务异常，请稍后重试', 500))
    }
  }
}

export default aiAudit
