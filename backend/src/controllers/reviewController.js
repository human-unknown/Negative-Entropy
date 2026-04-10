import db from '../config/database.js'
import { success, error } from '../utils/response.js'
import { autoEscalateViolation } from '../utils/violation.js'

/**
 * 获取待复核内容列表
 */
export const getReviewQueue = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query

    const offset = (page - 1) * limit

    // 查询待复核内容
    const [rows] = await db.query(
      `SELECT 
        id,
        content,
        content_type,
        user_id,
        related_id,
        audit_result,
        audit_reason,
        violations,
        confidence,
        status,
        created_at
      FROM content_review_queue
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [status, parseInt(limit), offset]
    )

    // 查询总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM content_review_queue WHERE status = ?',
      [status]
    )

    res.json(success({
      list: rows,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    }))
  } catch (err) {
    console.error('获取复核队列失败:', err)
    res.status(500).json(error('获取复核队列失败'))
  }
}

/**
 * 获取单个待复核内容详情
 */
export const getReviewDetail = async (req, res) => {
  try {
    const { id } = req.params

    const [rows] = await db.query(
      `SELECT 
        crq.*,
        u.username,
        u.level
      FROM content_review_queue crq
      LEFT JOIN user u ON crq.user_id = u.id
      WHERE crq.id = ?`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json(error('复核内容不存在', 404))
    }

    res.json(success(rows[0]))
  } catch (err) {
    console.error('获取复核详情失败:', err)
    res.status(500).json(error('获取复核详情失败'))
  }
}

/**
 * 通过复核
 */
export const approveReview = async (req, res) => {
  const connection = await db.getConnection()
  
  try {
    const { id } = req.params
    const { note } = req.body
    const adminId = req.user.userId

    await connection.beginTransaction()

    // 查询复核内容
    const [rows] = await connection.query(
      'SELECT * FROM content_review_queue WHERE id = ? AND status = ?',
      [id, 'pending']
    )

    if (rows.length === 0) {
      await connection.rollback()
      return res.status(404).json(error('复核内容不存在或已处理', 404))
    }

    const reviewItem = rows[0]

    // 更新复核状态为通过
    await connection.query(
      `UPDATE content_review_queue 
       SET status = ?, 
           reviewer_id = ?,
           review_note = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      ['approved', adminId, note || null, id]
    )

    // 根据内容类型更新原始内容状态
    if (reviewItem.related_id) {
      if (reviewItem.content_type === 'speech') {
        await connection.query(
          'UPDATE debate_speech SET audit_status = ? WHERE id = ?',
          [1, reviewItem.related_id]
        )
      } else if (reviewItem.content_type === 'topic') {
        await connection.query(
          'UPDATE debate_topic SET audit_status = ? WHERE id = ?',
          [1, reviewItem.related_id]
        )
      }
    }

    await connection.commit()

    res.json(success(null, '复核通过'))
  } catch (err) {
    await connection.rollback()
    console.error('通过复核失败:', err)
    res.status(500).json(error('通过复核失败'))
  } finally {
    connection.release()
  }
}

/**
 * 驳回复核
 */
export const rejectReview = async (req, res) => {
  const connection = await db.getConnection()
  
  try {
    const { id } = req.params
    const { reason, note } = req.body
    const adminId = req.user.userId

    if (!reason) {
      return res.status(400).json(error('请提供驳回原因', 400))
    }

    await connection.beginTransaction()

    const [rows] = await connection.query(
      'SELECT * FROM content_review_queue WHERE id = ? AND status = ?',
      [id, 'pending']
    )

    if (rows.length === 0) {
      await connection.rollback()
      return res.status(404).json(error('复核内容不存在或已处理', 404))
    }

    const reviewItem = rows[0]

    // 更新复核状态为驳回
    await connection.query(
      `UPDATE content_review_queue
       SET status = ?,
           reviewer_id = ?,
           reject_reason = ?,
           review_note = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      ['rejected', adminId, reason, note || null, id]
    )

    // 根据内容类型更新原始内容状态
    if (reviewItem.related_id) {
      if (reviewItem.content_type === 'speech') {
        await connection.query(
          'UPDATE debate_speech SET audit_status = ? WHERE id = ?',
          [2, reviewItem.related_id]
        )
      } else if (reviewItem.content_type === 'topic') {
        await connection.query(
          'UPDATE debate_topic SET audit_status = ? WHERE id = ?',
          [2, reviewItem.related_id]
        )
      }
    }

    // 自动升级违规并处罚
    try {
      const punishResult = await autoEscalateViolation(
        reviewItem.user_id,
        'manual_review_rejected',
        reviewItem.content
      )
      console.log('自动处罚执行成功:', punishResult)
    } catch (err) {
      console.error('自动处罚执行失败:', err)
      // 不回滚事务，继续完成驳回操作
    }

    await connection.commit()

    res.json(success(null, '复核驳回，已自动处罚'))
  } catch (err) {
    await connection.rollback()
    console.error('驳回复核失败:', err)
    res.status(500).json(error('驳回复核失败'))
  } finally {
    connection.release()
  }
}

/**
 * 批量处理复核
 */
export const batchReview = async (req, res) => {
  const connection = await db.getConnection()
  
  try {
    const { ids, action, reason, note } = req.body
    const adminId = req.user.userId

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(error('请提供要处理的ID列表', 400))
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json(error('无效的操作类型', 400))
    }

    if (action === 'reject' && !reason) {
      return res.status(400).json(error('驳回时必须提供原因', 400))
    }

    await connection.beginTransaction()

    const status = action === 'approve' ? 'approved' : 'rejected'
    const placeholders = ids.map(() => '?').join(',')

    // 批量更新复核状态
    const updateQuery = action === 'approve'
      ? `UPDATE content_review_queue 
         SET status = ?, reviewer_id = ?, review_note = ?, reviewed_at = NOW()
         WHERE id IN (${placeholders}) AND status = 'pending'`
      : `UPDATE content_review_queue 
         SET status = ?, reviewer_id = ?, reject_reason = ?, review_note = ?, reviewed_at = NOW()
         WHERE id IN (${placeholders}) AND status = 'pending'`

    const updateParams = action === 'approve'
      ? [status, adminId, note || null, ...ids]
      : [status, adminId, reason, note || null, ...ids]

    await connection.query(updateQuery, updateParams)

    await connection.commit()

    res.json(success(null, `批量${action === 'approve' ? '通过' : '驳回'}成功`))
  } catch (err) {
    await connection.rollback()
    console.error('批量处理复核失败:', err)
    res.status(500).json(error('批量处理复核失败'))
  } finally {
    connection.release()
  }
}
