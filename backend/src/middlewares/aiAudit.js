import { error } from '../utils/response.js'
import { autoEscalateViolation } from '../utils/violation.js'

/**
 * AI审核结果枚举
 */
export const AuditResult = {
  PASS: 'pass',           // 通过
  REJECT: 'reject',       // 拒绝
  MANUAL_REVIEW: 'manual_review'  // 待人工复核
}

/**
 * AI审核服务 - 模拟AI审核逻辑
 * 实际使用时应替换为真实的AI审核API调用
 */
class AIAuditService {
  /**
   * 审核内容
   * @param {string} content - 待审核内容
   * @param {string} type - 内容类型: 'speech'(发言) | 'topic'(话题) | 'username'(用户名)
   * @returns {Promise<{result: string, reason?: string, confidence?: number}>}
   */
  async auditContent(content, type) {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 100))

    // 基础规则检查
    const violations = this.checkBasicRules(content, type)
    
    if (violations.length > 0) {
      return {
        result: AuditResult.REJECT,
        reason: violations.join('; '),
        confidence: 0.95
      }
    }

    // 模拟AI审核逻辑
    const sensitiveScore = this.calculateSensitiveScore(content)
    
    if (sensitiveScore >= 0.8) {
      return {
        result: AuditResult.REJECT,
        reason: '内容包含敏感信息',
        confidence: sensitiveScore
      }
    } else if (sensitiveScore >= 0.5) {
      return {
        result: AuditResult.MANUAL_REVIEW,
        reason: '内容可能包含敏感信息，需人工复核',
        confidence: sensitiveScore
      }
    }

    return {
      result: AuditResult.PASS,
      confidence: 1 - sensitiveScore
    }
  }

  /**
   * 基础规则检查
   */
  checkBasicRules(content, type) {
    const violations = []

    // 空内容检查
    if (!content || content.trim().length === 0) {
      violations.push('内容不能为空')
      return violations
    }

    // 长度检查
    const maxLengths = {
      username: 20,
      topic: 200,
      speech: 1000
    }
    
    if (content.length > maxLengths[type]) {
      violations.push(`内容长度超过限制(${maxLengths[type]}字符)`)
    }

    // 用户名特殊规则
    if (type === 'username') {
      if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(content)) {
        violations.push('用户名只能包含中文、英文、数字和下划线')
      }
      if (content.length < 2) {
        violations.push('用户名长度不能少于2个字符')
      }
    }

    // 敏感词检查（示例）
    const sensitiveWords = ['违禁词1', '违禁词2', '广告', '赌博', '色情']
    const foundWords = sensitiveWords.filter(word => content.includes(word))
    if (foundWords.length > 0) {
      violations.push(`包含违禁词: ${foundWords.join(', ')}`)
    }

    return violations
  }

  /**
   * 计算敏感度分数 (0-1)
   * 实际使用时应调用真实的AI模型
   */
  calculateSensitiveScore(content) {
    // 模拟AI评分逻辑
    let score = 0

    // 检查特殊字符密度
    const specialChars = content.match(/[!@#$%^&*()]/g) || []
    score += Math.min(specialChars.length / content.length, 0.3)

    // 检查重复字符
    const repeats = content.match(/(.)\1{3,}/g) || []
    score += Math.min(repeats.length * 0.2, 0.3)

    // 检查可疑关键词
    const suspiciousKeywords = ['联系方式', '加微信', 'QQ', '电话', '转账']
    const foundSuspicious = suspiciousKeywords.filter(word => content.includes(word))
    score += foundSuspicious.length * 0.15

    return Math.min(score, 1)
  }
}

// 创建单例
export const aiAuditService = new AIAuditService()

/**
 * AI审核中间件
 * 用于审核发言、话题、用户名等内容
 * 
 * 使用方式:
 * router.post('/speech', aiAudit('content', 'speech'), controller)
 * router.post('/topic', aiAudit('title', 'topic'), controller)
 * router.post('/username', aiAudit('username', 'username'), controller)
 * 
 * @param {string} fieldName - 要审核的字段名
 * @param {string} contentType - 内容类型: 'speech' | 'topic' | 'username'
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
        // 记录违规并自动处罚
        if (req.user && req.user.userId) {
          try {
            await autoEscalateViolation(req.user.userId, `${contentType}_rejected`, content)
          } catch (err) {
            console.error('记录违规失败:', err)
          }
        }
        
        return res.status(400).json(error(
          `内容审核未通过: ${auditResult.reason}`,
          400,
          { auditResult, punished: true }
        ))
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
 * 批量审核中间件
 * 用于同时审核多个字段
 * 
 * 使用方式:
 * router.post('/topic', aiAuditBatch([
 *   { field: 'title', type: 'topic' },
 *   { field: 'description', type: 'speech' }
 * ]), controller)
 */
export const aiAuditBatch = (fields) => {
  return async (req, res, next) => {
    try {
      const auditResults = {}
      let hasRejection = false
      let needsManualReview = false

      for (const { field, type } of fields) {
        const content = req.body[field]

        if (!content) {
          return res.status(400).json(error(`缺少必需字段: ${field}`, 400))
        }

        const result = await aiAuditService.auditContent(content, type)
        auditResults[field] = result

        if (result.result === AuditResult.REJECT) {
          hasRejection = true
          break
        }

        if (result.result === AuditResult.MANUAL_REVIEW) {
          needsManualReview = true
        }
      }

      req.auditResults = auditResults

      if (hasRejection) {
        // 记录违规并自动处罚
        if (req.user && req.user.userId) {
          const rejectedField = Object.entries(auditResults).find(
            ([_, result]) => result.result === AuditResult.REJECT
          )
          try {
            await autoEscalateViolation(req.user.userId, `${rejectedField[0]}_rejected`, req.body[rejectedField[0]])
          } catch (err) {
            console.error('记录违规失败:', err)
          }
        }
        
        const rejectedField = Object.entries(auditResults).find(
          ([_, result]) => result.result === AuditResult.REJECT
        )
        return res.status(400).json(error(
          `内容审核未通过: ${rejectedField[1].reason}`,
          400,
          { auditResults, punished: true }
        ))
      }

      if (needsManualReview) {
        req.needsManualReview = true
      }

      next()
    } catch (err) {
      console.error('批量AI审核中间件错误:', err)
      res.status(500).json(error('内容审核服务异常，请稍后重试', 500))
    }
  }
}

export default aiAudit
