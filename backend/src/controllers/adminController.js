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
    // 社区统计
    const [postCount] = await pool.query('SELECT COUNT(*) as count FROM post WHERE status != 2')
    const [commentCount] = await pool.query('SELECT COUNT(*) as count FROM comment WHERE is_deleted = 0')
    const [channelCount] = await pool.query('SELECT COUNT(*) as count FROM channel')
    const [pendingPosts] = await pool.query('SELECT COUNT(*) as count FROM post WHERE audit_status = 0')

    res.json(success({
      activeUsers: activeUsers[0].count,
      totalUsers: userCount[0].count,
      topics: topicCount[0].count,
      speeches: speechCount[0].count,
      violations: violationCount[0].count,
      pendingTopics: pendingTopics[0].count,
      pendingReviews: pendingReviews[0].count,
      pendingReports: pendingReports[0].count,
      posts: postCount[0].count,
      comments: commentCount[0].count,
      channels: channelCount[0].count,
      pendingPosts: pendingPosts[0].count
    }))
  } catch (err) {
    console.error('获取统计数据失败:', err)
    res.json(error('获取统计数据失败', 500))
  }
}

// ======== 社区管理 ========

/**
 * GET /api/admin/posts — 管理帖子列表
 */
export const getAdminPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const conditions = ['1=1']
    const params = []

    if (status !== undefined) {
      conditions.push('p.status = ?')
      params.push(parseInt(status))
    }
    if (keyword) {
      conditions.push('(p.title LIKE ? OR p.content LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const [rows] = await pool.query(
      `SELECT p.*, u.name AS author_name, c.name AS channel_name
       FROM post p JOIN user u ON p.author_id = u.id
       JOIN channel c ON p.channel_id = c.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    )
    const [count] = await pool.query(
      `SELECT COUNT(*) AS total FROM post p WHERE ${conditions.join(' AND ')}`, params
    )

    res.json(success({ list: rows, total: count[0].total, page: parseInt(page), limit: parseInt(limit) }))
  } catch (err) {
    console.error('获取管理帖子列表失败:', err)
    res.json(error('获取失败', 500))
  }
}

/**
 * PUT /api/admin/posts/:postId — 管理操作（审核/删除/恢复）
 */
export const managePost = async (req, res) => {
  try {
    const { postId } = req.params
    const { action } = req.body

    if (action === 'approve') {
      await pool.query('UPDATE post SET audit_status = 1 WHERE id = ?', [postId])
    } else if (action === 'reject') {
      await pool.query('UPDATE post SET audit_status = 2 WHERE id = ?', [postId])
    } else if (action === 'delete') {
      await pool.query('UPDATE post SET status = 2 WHERE id = ?', [postId])
    } else if (action === 'restore') {
      await pool.query('UPDATE post SET status = 0, audit_status = 1 WHERE id = ?', [postId])
    } else {
      return res.status(400).json(error('无效操作', 400))
    }

    res.json(success(null, '操作成功'))
  } catch (err) {
    console.error('管理帖子操作失败:', err)
    res.json(error('操作失败', 500))
  }
}

/**
 * GET /api/admin/comments — 管理评论列表
 */
export const getAdminComments = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const conditions = ['1=1']
    const params = []

    if (keyword) {
      conditions.push('c.content LIKE ?')
      params.push(`%${keyword}%`)
    }

    const [rows] = await pool.query(
      `SELECT c.*, u.name AS author_name, p.title AS post_title
       FROM comment c JOIN user u ON c.author_id = u.id
       JOIN post p ON c.post_id = p.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    )
    const [count] = await pool.query(
      `SELECT COUNT(*) AS total FROM comment c WHERE ${conditions.join(' AND ')}`, params
    )

    res.json(success({ list: rows, total: count[0].total, page: parseInt(page), limit: parseInt(limit) }))
  } catch (err) {
    console.error('获取管理评论列表失败:', err)
    res.json(error('获取失败', 500))
  }
}

/**
 * DELETE /api/admin/comments/:commentId — 删除评论
 */
export const manageComment = async (req, res) => {
  try {
    const { commentId } = req.params
    await pool.query('UPDATE comment SET is_deleted = 1 WHERE id = ?', [commentId])
    res.json(success(null, '已删除'))
  } catch (err) {
    console.error('删除评论失败:', err)
    res.json(error('操作失败', 500))
  }
}

// ═══════════ AI审核管理 ═══════════

/**
 * GET /api/admin/ai/config — 获取AI审核配置
 */
export const getAIConfig = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT config_key, config_value, description FROM ai_audit_config ORDER BY id'
    )
    const config = {}
    for (const r of rows) {
      config[r.config_key] = r.config_value
    }
    res.json(success(config))
  } catch (err) {
    console.error('获取AI配置失败:', err)
    res.json(error('获取失败', 500))
  }
}

/**
 * PUT /api/admin/ai/config — 更新AI审核配置
 */
export const updateAIConfig = async (req, res) => {
  try {
    const updates = req.body
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return res.json(error('配置数据不能为空', 400))
    }

    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        'UPDATE ai_audit_config SET config_value = ? WHERE config_key = ?',
        [String(value), key]
      )
    }

    res.json(success({ message: '配置已更新' }))
  } catch (err) {
    console.error('更新AI配置失败:', err)
    res.json(error('更新失败', 500))
  }
}

/**
 * GET /api/admin/ai/stats — AI审核统计
 */
export const getAIStats = async (req, res) => {
  try {
    const { days = 7 } = req.query

    const [[totalRow]] = await pool.query(
      `SELECT COUNT(*) as total FROM ai_audit_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [parseInt(days)]
    )

    const [verdictRows] = await pool.query(
      `SELECT verdict, COUNT(*) as count FROM ai_audit_log
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY verdict`,
      [parseInt(days)]
    )

    const [avgRow] = await pool.query(
      `SELECT AVG(elapsed_ms) as avg_ms, SUM(prompt_tokens) as total_prompt_tokens,
              SUM(completion_tokens) as total_completion_tokens
       FROM ai_audit_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [parseInt(days)]
    )

    const verdicts = {}
    for (const r of verdictRows) {
      verdicts[r.verdict] = r.count
    }

    res.json(success({
      total: totalRow.total || 0,
      pass: verdicts.pass || 0,
      manual_review: verdicts.manual_review || 0,
      reject: verdicts.reject || 0,
      avgElapsedMs: Math.round(avgRow.avg_ms || 0),
      totalPromptTokens: avgRow.total_prompt_tokens || 0,
      totalCompletionTokens: avgRow.total_completion_tokens || 0,
    }))
  } catch (err) {
    console.error('获取AI统计失败:', err)
    res.json(error('获取失败', 500))
  }
}

/**
 * GET /api/admin/ai/logs — AI审核日志
 */
export const getAILogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, verdict, content_type } = req.query
    const offset = (page - 1) * limit

    let where = '1=1'
    const params = []

    if (verdict) {
      where += ' AND verdict = ?'
      params.push(verdict)
    }
    if (content_type) {
      where += ' AND content_type = ?'
      params.push(content_type)
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM ai_audit_log WHERE ${where}`,
      params
    )

    const [rows] = await pool.query(
      `SELECT id, content_type, verdict, reason, confidence, categories,
              model, elapsed_ms, prompt_tokens, completion_tokens, created_at
       FROM ai_audit_log WHERE ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    )

    res.json(success({
      list: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    }))
  } catch (err) {
    console.error('获取AI日志失败:', err)
    res.json(error('获取失败', 500))
  }
}

// ═══════════ 敏感词管理 ═══════════

/**
 * GET /api/admin/sensitive-words — 敏感词列表
 */
export const getSensitiveWords = async (req, res) => {
  try {
    const { level, category, page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit

    let where = '1=1'
    const params = []

    if (level) { where += ' AND level = ?'; params.push(level) }
    if (category) { where += ' AND category = ?'; params.push(category) }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM sensitive_words WHERE ${where}`,
      params
    )

    const [rows] = await pool.query(
      `SELECT id, word, level, category, is_active, created_at, updated_at
       FROM sensitive_words WHERE ${where}
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    )

    res.json(success({ list: rows, total, page: parseInt(page), limit: parseInt(limit) }))
  } catch (err) {
    console.error('获取敏感词列表失败:', err)
    res.json(error('获取失败', 500))
  }
}

/**
 * POST /api/admin/sensitive-words — 添加敏感词
 */
export const addSensitiveWord = async (req, res) => {
  try {
    const { word, level = 'blocked', category } = req.body
    if (!word || !word.trim()) {
      return res.json(error('敏感词不能为空', 400))
    }
    if (!['blocked', 'suspicious'].includes(level)) {
      return res.json(error('级别无效', 400))
    }

    await pool.query(
      'INSERT INTO sensitive_words (word, level, category) VALUES (?, ?, ?)',
      [word.trim(), level, category || null]
    )
    res.json(success({ message: '已添加' }))
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.json(error('该敏感词已存在', 400))
    }
    console.error('添加敏感词失败:', err)
    res.json(error('添加失败', 500))
  }
}

/**
 * PUT /api/admin/sensitive-words/:id — 更新敏感词
 */
export const updateSensitiveWord = async (req, res) => {
  try {
    const { id } = req.params
    const { word, level, category, is_active } = req.body

    const updates = []
    const params = []

    if (word !== undefined) { updates.push('word = ?'); params.push(word.trim()) }
    if (level !== undefined) { updates.push('level = ?'); params.push(level) }
    if (category !== undefined) { updates.push('category = ?'); params.push(category) }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active) }

    if (updates.length === 0) {
      return res.json(error('无更新内容', 400))
    }

    params.push(id)
    await pool.query(
      `UPDATE sensitive_words SET ${updates.join(', ')} WHERE id = ?`,
      params
    )
    res.json(success({ message: '已更新' }))
  } catch (err) {
    console.error('更新敏感词失败:', err)
    res.json(error('更新失败', 500))
  }
}

/**
 * DELETE /api/admin/sensitive-words/:id — 删除敏感词
 */
export const deleteSensitiveWord = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM sensitive_words WHERE id = ?', [id])
    res.json(success({ message: '已删除' }))
  } catch (err) {
    console.error('删除敏感词失败:', err)
    res.json(error('删除失败', 500))
  }
}
