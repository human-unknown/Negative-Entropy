import db from '../config/database.js'

/**
 * 审核日志服务
 * 记录所有审核操作，包括AI审核和人工审核
 */
class AuditLogService {
  /**
   * 记录AI审核日志
   * @param {Object} data - 审核数据
   * @param {number} data.userId - 被审核用户ID
   * @param {string} data.content - 被审核内容
   * @param {string} data.contentType - 内容类型: 'speech' | 'topic' | 'username'
   * @param {number} data.contentId - 关联内容ID（可选）
   * @param {string} data.auditResult - 审核结果: 'pass' | 'reject' | 'manual_review'
   * @param {Array} data.violations - 违规类型数组（可选）
   * @param {string} data.reason - 审核原因（可选）
   */
  async logAIAudit(data) {
    const {
      userId,
      content,
      contentType,
      contentId = null,
      auditResult,
      violations = null,
      reason = null
    } = data

    try {
      await db.query(
        `INSERT INTO audit_log 
         (user_id, content, content_type, content_id, audit_type, audit_result, violations, reason, created_at)
         VALUES (?, ?, ?, ?, 'ai', ?, ?, ?, NOW())`,
        [
          userId,
          content,
          contentType,
          contentId,
          auditResult,
          violations ? JSON.stringify(violations) : null,
          reason
        ]
      )
    } catch (error) {
      console.error('记录AI审核日志失败:', error)
      throw error
    }
  }

  /**
   * 记录人工审核日志
   * @param {Object} data - 审核数据
   * @param {number} data.userId - 被审核用户ID
   * @param {string} data.content - 被审核内容
   * @param {string} data.contentType - 内容类型
   * @param {number} data.contentId - 关联内容ID（可选）
   * @param {string} data.auditResult - 审核结果: 'pass' | 'reject'
   * @param {number} data.reviewerId - 审核员ID
   * @param {Array} data.violations - 违规类型数组（可选）
   * @param {string} data.reason - 审核原因（可选）
   */
  async logManualAudit(data) {
    const {
      userId,
      content,
      contentType,
      contentId = null,
      auditResult,
      reviewerId,
      violations = null,
      reason = null
    } = data

    try {
      await db.query(
        `INSERT INTO audit_log 
         (user_id, content, content_type, content_id, audit_type, audit_result, violations, reason, reviewer_id, created_at)
         VALUES (?, ?, ?, ?, 'manual', ?, ?, ?, ?, NOW())`,
        [
          userId,
          content,
          contentType,
          contentId,
          auditResult,
          violations ? JSON.stringify(violations) : null,
          reason,
          reviewerId
        ]
      )
    } catch (error) {
      console.error('记录人工审核日志失败:', error)
      throw error
    }
  }

  /**
   * 查询审核日志
   * @param {Object} filters - 查询条件
   * @param {number} filters.userId - 用户ID（可选）
   * @param {string} filters.auditType - 审核类型（可选）
   * @param {string} filters.auditResult - 审核结果（可选）
   * @param {string} filters.contentType - 内容类型（可选）
   * @param {number} filters.reviewerId - 审核员ID（可选）
   * @param {string} filters.startDate - 开始日期（可选）
   * @param {string} filters.endDate - 结束日期（可选）
   * @param {number} filters.page - 页码
   * @param {number} filters.limit - 每页数量
   */
  async queryLogs(filters = {}) {
    const {
      userId,
      auditType,
      auditResult,
      contentType,
      reviewerId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = filters

    const offset = (page - 1) * limit
    const conditions = []
    const params = []

    if (userId) {
      conditions.push('al.user_id = ?')
      params.push(userId)
    }

    if (auditType) {
      conditions.push('al.audit_type = ?')
      params.push(auditType)
    }

    if (auditResult) {
      conditions.push('al.audit_result = ?')
      params.push(auditResult)
    }

    if (contentType) {
      conditions.push('al.content_type = ?')
      params.push(contentType)
    }

    if (reviewerId) {
      conditions.push('al.reviewer_id = ?')
      params.push(reviewerId)
    }

    if (startDate) {
      conditions.push('al.created_at >= ?')
      params.push(startDate)
    }

    if (endDate) {
      conditions.push('al.created_at <= ?')
      params.push(endDate)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    try {
      // 查询日志列表
      const [rows] = await db.query(
        `SELECT 
          al.*,
          u.username as user_name,
          r.username as reviewer_name
         FROM audit_log al
         LEFT JOIN user u ON al.user_id = u.id
         LEFT JOIN user r ON al.reviewer_id = r.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      )

      // 查询总数
      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM audit_log al ${whereClause}`,
        params
      )

      return {
        list: rows,
        total: countResult[0].total,
        page,
        limit
      }
    } catch (error) {
      console.error('查询审核日志失败:', error)
      throw error
    }
  }

  /**
   * 获取用户审核统计
   * @param {number} userId - 用户ID
   * @param {number} days - 统计天数（默认30天）
   */
  async getUserAuditStats(userId, days = 30) {
    try {
      const [rows] = await db.query(
        `SELECT 
          audit_result,
          COUNT(*) as count
         FROM audit_log
         WHERE user_id = ? 
           AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY audit_result`,
        [userId, days]
      )

      const stats = {
        pass: 0,
        reject: 0,
        manual_review: 0,
        total: 0
      }

      rows.forEach(row => {
        stats[row.audit_result] = row.count
        stats.total += row.count
      })

      return stats
    } catch (error) {
      console.error('获取用户审核统计失败:', error)
      throw error
    }
  }

  /**
   * 获取审核员工作统计
   * @param {number} reviewerId - 审核员ID
   * @param {number} days - 统计天数（默认30天）
   */
  async getReviewerStats(reviewerId, days = 30) {
    try {
      const [rows] = await db.query(
        `SELECT 
          audit_result,
          COUNT(*) as count
         FROM audit_log
         WHERE reviewer_id = ? 
           AND audit_type = 'manual'
           AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY audit_result`,
        [reviewerId, days]
      )

      const stats = {
        approved: 0,
        rejected: 0,
        total: 0
      }

      rows.forEach(row => {
        if (row.audit_result === 'pass') {
          stats.approved = row.count
        } else if (row.audit_result === 'reject') {
          stats.rejected = row.count
        }
        stats.total += row.count
      })

      return stats
    } catch (error) {
      console.error('获取审核员统计失败:', error)
      throw error
    }
  }
}

// 创建单例
const auditLogService = new AuditLogService()

// 简化的日志记录函数
export const logAudit = async (conn, data) => {
  const { userId, action, targetType, targetId, details } = data
  await conn.query(
    'INSERT INTO audit_log (user_id, action, target_type, target_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [userId, action, targetType, targetId, details]
  )
}

export default auditLogService
export { AuditLogService }
