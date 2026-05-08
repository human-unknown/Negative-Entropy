import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import { logAudit } from '../utils/auditLog.js'
import { USER_LEVEL } from '../constants/userLevel.js'

const PUNISH_TYPE = {
  WARNING: 1,
  MUTE: 2,
  BAN: 3
}

export const punishUser = async (req, res) => {
  const { userId, type, reason, duration } = req.body
  const adminId = req.user?.id

  if (!userId || !type || !reason) {
    return res.json(error('参数不完整', 400))
  }

  if (!Object.values(PUNISH_TYPE).includes(type)) {
    return res.json(error('处罚类型无效', 400))
  }

  let conn
  try {
    conn = await pool.getConnection()
    await conn.beginTransaction()

    const [users] = await conn.query(
      'SELECT id, name, level FROM user WHERE id = ?',
      [userId]
    )

    if (!users.length) {
      await conn.rollback()
      return res.json(error('用户不存在', 404))
    }

    const user = users[0]

    if (user.level === USER_LEVEL.ADMIN) {
      await conn.rollback()
      return res.json(error('不能处罚管理员', 403))
    }

    let expireAt = null
    let durationMinutes = null

    if (type === PUNISH_TYPE.MUTE || type === PUNISH_TYPE.BAN) {
      if (duration && duration > 0) {
        durationMinutes = duration * 24 * 60
        expireAt = new Date(Date.now() + durationMinutes * 60 * 1000)
      }
    }

    const [violationResult] = await conn.query(
      `INSERT INTO user_violation (user_id, type, reason, created_by) 
       VALUES (?, ?, ?, ?)`,
      [userId, getViolationType(type), reason, adminId]
    )

    const violationId = violationResult.insertId

    await conn.query(
      `INSERT INTO user_punish (user_id, violation_id, type, duration, expire_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, violationId, type, durationMinutes, expireAt]
    )

    if (type === PUNISH_TYPE.MUTE) {
      await conn.query(
        'UPDATE user SET status = ? WHERE id = ?',
        ['muted', userId]
      )
    } else if (type === PUNISH_TYPE.BAN) {
      await conn.query(
        'UPDATE user SET status = ? WHERE id = ?',
        ['banned', userId]
      )
    }

    await logAudit(conn, {
      userId: adminId,
      action: 'punish_user',
      targetType: 'user',
      targetId: userId,
      details: JSON.stringify({
        type: getPunishTypeName(type),
        reason,
        duration: durationMinutes,
        expireAt
      })
    })

    await conn.commit()

    res.json(success({
      message: '处罚成功',
      punishType: getPunishTypeName(type),
      expireAt
    }))
  } catch (err) {
    if (conn) await conn.rollback()
    console.error('处罚用户失败:', err)
    res.json(error('处罚失败', 500))
  } finally {
    if (conn) conn.release()
  }
}

export const restoreUser = async (req, res) => {
  const { userId } = req.body
  const adminId = req.user?.id

  if (!userId) {
    return res.json(error('用户ID不能为空', 400))
  }

  let conn
  try {
    conn = await pool.getConnection()
    await conn.beginTransaction()

    const [users] = await conn.query(
      'SELECT id, name, status FROM user WHERE id = ?',
      [userId]
    )

    if (!users.length) {
      await conn.rollback()
      return res.json(error('用户不存在', 404))
    }

    const user = users[0]

    if (user.status === 'normal') {
      await conn.rollback()
      return res.json(error('用户状态正常，无需恢复', 400))
    }

    await conn.query(
      'UPDATE user SET status = ? WHERE id = ?',
      ['normal', userId]
    )

    await logAudit(conn, {
      userId: adminId,
      action: 'restore_user',
      targetType: 'user',
      targetId: userId,
      details: JSON.stringify({
        previousStatus: user.status
      })
    })

    await conn.commit()

    res.json(success({
      message: '恢复权限成功',
      userId
    }))
  } catch (err) {
    if (conn) await conn.rollback()
    console.error('恢复用户权限失败:', err)
    res.json(error('恢复权限失败', 500))
  } finally {
    if (conn) conn.release()
  }
}

export const searchUsers = async (req, res) => {
  const { query } = req.query

  if (!query || !query.trim()) {
    return res.json(error('搜索关键词不能为空', 400))
  }

  try {
    const searchTerm = `%${query.trim()}%`
    const [users] = await pool.query(
      `SELECT id, name, level, exp, status, created_at 
       FROM user 
       WHERE name LIKE ? OR id = ?
       LIMIT 20`,
      [searchTerm, isNaN(query) ? 0 : parseInt(query)]
    )

    res.json(success({ users }))
  } catch (err) {
    console.error('搜索用户失败:', err)
    res.json(error('搜索失败', 500))
  }
}

export const getUserDetail = async (req, res) => {
  const { userId } = req.params

  if (!userId) {
    return res.json(error('用户ID不能为空', 400))
  }

  try {
    const [users] = await pool.query(
      `SELECT id, name, level, exp, status, created_at 
       FROM user 
       WHERE id = ?`,
      [userId]
    )

    if (!users.length) {
      return res.json(error('用户不存在', 404))
    }

    const [violations] = await pool.query(
      `SELECT id, type, reason, created_at 
       FROM user_violation 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    )

    const [punishments] = await pool.query(
      `SELECT id, type, duration, expire_at, created_at 
       FROM user_punish 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    )

    res.json(success({
      user: users[0],
      violations,
      punishments
    }))
  } catch (err) {
    console.error('获取用户详情失败:', err)
    res.json(error('获取用户详情失败', 500))
  }
}

const getViolationType = (punishType) => {
  const typeMap = {
    [PUNISH_TYPE.WARNING]: 'warning',
    [PUNISH_TYPE.MUTE]: 'spam',
    [PUNISH_TYPE.BAN]: 'severe_violation'
  }
  return typeMap[punishType] || 'other'
}

const getPunishTypeName = (type) => {
  const nameMap = {
    [PUNISH_TYPE.WARNING]: '警告',
    [PUNISH_TYPE.MUTE]: '禁言',
    [PUNISH_TYPE.BAN]: '封号'
  }
  return nameMap[type] || '未知'
}

export const getPendingTopics = async (req, res) => {
  try {
    const [topics] = await pool.query(
      `SELECT dt.id, dt.title, dt.description, dt.publisher_id as creator_id,
              u.name as creator_name, dt.created_at
       FROM debate_topic dt
       JOIN user u ON dt.publisher_id = u.id
       WHERE dt.audit_status = 0
       ORDER BY dt.created_at ASC`
    )

    res.json(success({ topics, count: topics.length }))
  } catch (err) {
    console.error('获取待审核话题失败:', err)
    res.json(error('获取待审核话题失败', 500))
  }
}

export const reviewTopic = async (req, res) => {
  const { topicId, action, reason } = req.body
  const adminId = req.user?.id

  if (!topicId || !action) {
    return res.json(error('参数不完整', 400))
  }

  if (action === 'reject' && !reason) {
    return res.json(error('驳回必须填写理由', 400))
  }

  let conn
  try {
    conn = await pool.getConnection()
    await conn.beginTransaction()

    const [topics] = await conn.query(
      'SELECT id, title, publisher_id FROM debate_topic WHERE id = ?',
      [topicId]
    )

    if (!topics.length) {
      await conn.rollback()
      return res.json(error('话题不存在', 404))
    }

    const auditStatus = action === 'approve' ? 1 : 2

    await conn.query(
      'UPDATE debate_topic SET audit_status = ? WHERE id = ?',
      [auditStatus, topicId]
    )

    await logAudit(conn, {
      userId: adminId,
      action: `topic_${action}`,
      targetType: 'debate_topic',
      targetId: topicId,
      details: JSON.stringify({ reason: reason || null })
    })

    await conn.commit()

    res.json(success({
      message: action === 'approve' ? '审核通过' : '已驳回',
      topicId
    }))
  } catch (err) {
    if (conn) await conn.rollback()
    console.error('审核话题失败:', err)
    res.json(error('审核失败', 500))
  } finally {
    if (conn) conn.release()
  }
}

export const getAIErrors = async (req, res) => {
  try {
    const [errors] = await pool.query(
      `SELECT id, content_type, content, ai_result, created_at
       FROM content_review_queue
       WHERE status = 'error'
       ORDER BY created_at DESC
       LIMIT 50`
    )

    res.json(success({ errors, count: errors.length }))
  } catch (err) {
    console.error('获取AI错误记录失败:', err)
    res.json(error('获取失败', 500))
  }
}

export const submitAIOptimization = async (req, res) => {
  const { labels } = req.body
  const adminId = req.user?.id

  if (!labels || !Array.isArray(labels) || labels.length === 0) {
    return res.json(error('标记数据不能为空', 400))
  }

  let conn
  try {
    conn = await pool.getConnection()
    await conn.beginTransaction()

    for (const label of labels) {
      await conn.query(
        `UPDATE content_review_queue
         SET correct_result = ?, status = 'labeled'
         WHERE id = ?`,
        [label.correctResult, label.id]
      )
    }

    await logAudit(conn, {
      userId: adminId,
      action: 'ai_optimization',
      targetType: 'system',
      targetId: 0,
      details: JSON.stringify({ count: labels.length })
    })

    await conn.commit()

    res.json(success({ message: '优化数据已提交', count: labels.length }))
  } catch (err) {
    if (conn) await conn.rollback()
    console.error('提交优化数据失败:', err)
    res.json(error('提交失败', 500))
  } finally {
    if (conn) conn.release()
  }
}

export const getStats = async (req, res) => {
  try {
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM user WHERE is_deleted = 0')
    const [activeUsers] = await pool.query('SELECT COUNT(*) as count FROM user WHERE is_deleted = 0 AND status = 1')
    const [topicCount] = await pool.query('SELECT COUNT(*) as count FROM debate_topic')
    const [speechCount] = await pool.query('SELECT COUNT(*) as count FROM debate_speech')
    const [violationCount] = await pool.query('SELECT COUNT(*) as count FROM user_violation')
    const [pendingTopics] = await pool.query('SELECT COUNT(*) as count FROM debate_topic WHERE audit_status = 0')
    const [pendingReviews] = await pool.query('SELECT COUNT(*) as count FROM content_review_queue WHERE status = "pending"')
    const [pendingReports] = await pool.query('SELECT COUNT(*) as count FROM report WHERE status = 0')

    res.json(success({
      activeUsers: activeUsers[0].count,
      totalUsers: userCount[0].count,
      topics: topicCount[0].count,
      speeches: speechCount[0].count,
      violations: violationCount[0].count,
      pendingTopics: pendingTopics[0].count,
      pendingReviews: pendingReviews[0].count,
      pendingReports: pendingReports[0].count
    }))
  } catch (err) {
    console.error('获取统计数据失败:', err)
    res.json(error('获取统计数据失败', 500))
  }
}
