import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import { USER_LEVEL } from '../constants/userLevel.js'
import { DEBATE_STATUS } from '../constants/debateStatus.js'

export const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT category FROM debate_topic WHERE audit_status = 1 ORDER BY category'
    )
    res.json(success(rows.map(r => r.category)))
  } catch (err) {
    console.error('获取分类失败:', err)
    res.json(error('获取分类失败', 500))
  }
}

export const getTopics = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      category,
      status,
      keyword,
      sort = 'time'
    } = req.query

    const offset = (page - 1) * pageSize
    const conditions = ['audit_status = 1']
    const params = []

    if (category) {
      conditions.push('category = ?')
      params.push(category)
    }
    if (status !== undefined) {
      conditions.push('status = ?')
      params.push(status)
    }
    if (keyword) {
      conditions.push('(title LIKE ? OR description LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const whereClause = conditions.join(' AND ')
    
    const sortMap = {
      time: 'dt.created_at DESC',
      heat: 'heat DESC',
      participants: 'participant_count DESC'
    }
    const orderBy = sortMap[sort] || sortMap.time

    const [rows] = await pool.query(
      `SELECT dt.*, u.name as publisher_name,
       (SELECT COUNT(*) FROM debate_participant WHERE topic_id = dt.id) as participant_count,
       (SELECT COUNT(*) FROM debate_speech WHERE topic_id = dt.id) as heat
       FROM debate_topic dt
       LEFT JOIN user u ON dt.publisher_id = u.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM debate_topic WHERE ${whereClause}`,
      params
    )

    res.json(success({
      list: rows,
      total: countResult[0].total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }))
  } catch (err) {
    console.error('获取话题列表失败:', err)
    res.json(error('获取话题列表失败', 500))
  }
}

export const createTopic = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { title, description, category, pro_limit = 5, con_limit = 5 } = req.body
    const userId = req.user.userId

    if (!title || !description || !category) {
      await conn.release()
      return res.json(error('标题、描述和分类不能为空', 400))
    }

    if (title.length > 100 || description.length > 1000) {
      await conn.release()
      return res.json(error('标题或描述过长', 400))
    }

    await conn.beginTransaction()

    // 获取AI审核结果
    const auditResults = req.auditResults || {}
    const needsManualReview = req.needsManualReview || false

    // 根据AI审核结果决定初始状态
    // 0: 待审核, 1: 审核通过, 2: 审核拒绝
    let initialAuditStatus = needsManualReview ? 0 : 1

    // 插入话题
    const [result] = await conn.query(
      'INSERT INTO debate_topic (title, description, category, publisher_id, pro_limit, con_limit, audit_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, category, userId, pro_limit, con_limit, initialAuditStatus, DEBATE_STATUS.PENDING]
    )

    const topicId = result.insertId

    // 如果需要人工复核，添加到复核队列
    if (needsManualReview) {
      const violations = []
      let auditReason = ''
      let confidence = 0

      // 收集审核信息
      if (auditResults.title) {
        confidence = Math.max(confidence, auditResults.title.confidence || 0)
        if (auditResults.title.reason) {
          auditReason += `标题: ${auditResults.title.reason}; `
        }
      }
      if (auditResults.description) {
        confidence = Math.max(confidence, auditResults.description.confidence || 0)
        if (auditResults.description.reason) {
          auditReason += `描述: ${auditResults.description.reason}`
        }
      }

      await conn.query(
        `INSERT INTO content_review_queue
         (content, content_type, user_id, related_id, audit_result, audit_reason, violations, confidence, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          JSON.stringify({ title, description }),
          'topic',
          userId,
          topicId,
          'manual_review',
          auditReason,
          JSON.stringify(violations),
          confidence,
          'pending'
        ]
      )
    }

    await conn.commit()

    const message = needsManualReview
      ? '话题已提交，AI检测到可能的问题，正在等待管理员复核'
      : '话题发布成功，已通过AI审核'

    res.json(success({ topicId, needsManualReview }, message))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('发布话题失败:', err)
    res.json(error('发布话题失败', 500))
  } finally {
    conn.release()
  }
}

export const auditTopic = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { topicId } = req.params
    const { audit_status, reason } = req.body
    const auditorId = req.user.userId

    if (![1, 2].includes(audit_status)) {
      return res.json(error('审核状态无效', 400))
    }

    await conn.beginTransaction()

    await conn.query(
      'UPDATE debate_topic SET audit_status = ? WHERE id = ?',
      [audit_status, topicId]
    )

    await conn.query(
      'INSERT INTO debate_audit_log (topic_id, auditor_id, audit_status, reason) VALUES (?, ?, ?, ?)',
      [topicId, auditorId, audit_status, reason || null]
    )

    await conn.commit()
    res.json(success(null, audit_status === 1 ? '审核通过' : '已驳回'))
  } catch (err) {
    await conn.rollback()
    console.error('审核失败:', err)
    res.json(error('审核失败', 500))
  } finally {
    conn.release()
  }
}

export const joinTopic = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { topicId } = req.params
    const { stance } = req.body
    const userId = req.user.userId

    if (!stance || ![1, 2].includes(parseInt(stance))) {
      await conn.release()
      return res.json(error('立场无效', 400))
    }

    await conn.beginTransaction()

    const [topic] = await conn.query(
      'SELECT pro_limit, con_limit, status FROM debate_topic WHERE id = ? AND audit_status = 1',
      [topicId]
    )
    if (!topic.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('话题不存在或未通过审核', 404))
    }

    if (topic[0].status === DEBATE_STATUS.CLOSED || topic[0].status === DEBATE_STATUS.SETTLED) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论已结束，无法加入', 400))
    }

    const [existing] = await conn.query(
      'SELECT id FROM debate_participant WHERE topic_id = ? AND user_id = ? FOR UPDATE',
      [topicId, userId]
    )
    if (existing.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('已加入该话题', 400))
    }

    const [count] = await conn.query(
      'SELECT COUNT(*) as cnt FROM debate_participant WHERE topic_id = ? AND stance = ? FOR UPDATE',
      [topicId, stance]
    )
    const limit = stance === 1 ? topic[0].pro_limit : topic[0].con_limit
    if (count[0].cnt >= limit) {
      await conn.rollback()
      conn.release()
      return res.json(error(stance === 1 ? '正方人数已满' : '反方人数已满', 400))
    }

    await conn.query(
      'INSERT INTO debate_participant (topic_id, user_id, stance) VALUES (?, ?, ?)',
      [topicId, userId, stance]
    )

    await conn.commit()
    res.json(success(null, '加入成功'))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('加入辩论失败:', err)
    res.json(error(err.code === 'ER_DUP_ENTRY' ? '已加入该话题' : '加入辩论失败', 500))
  } finally {
    conn.release()
  }
}

export const createSpeech = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { topicId } = req.params
    const { content } = req.body
    const userId = req.user.userId

    if (!content || typeof content !== 'string') {
      await conn.release()
      return res.json(error('发言内容不能为空', 400))
    }

    const wordCount = content.trim().length
    if (wordCount < 10 || wordCount > 500) {
      await conn.release()
      return res.json(error('发言字数需在10-500字之间', 400))
    }

    await conn.beginTransaction()

    const [topic] = await conn.query(
      'SELECT status FROM debate_topic WHERE id = ? AND audit_status = 1 FOR UPDATE',
      [topicId]
    )
    if (!topic.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('话题不存在或未通过审核', 404))
    }
    if (topic[0].status !== DEBATE_STATUS.ACTIVE && topic[0].status !== DEBATE_STATUS.PENDING) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论未开始或已结束', 400))
    }

    const [participant] = await conn.query(
      'SELECT stance FROM debate_participant WHERE topic_id = ? AND user_id = ?',
      [topicId, userId]
    )
    if (!participant.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('未加入该话题', 403))
    }

    const [lastSpeech] = await conn.query(
      'SELECT created_at FROM debate_speech WHERE topic_id = ? AND user_id = ? AND role = 1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE',
      [topicId, userId]
    )
    if (lastSpeech.length) {
      const cooldown = 60
      const elapsed = (Date.now() - new Date(lastSpeech[0].created_at).getTime()) / 1000
      if (elapsed < cooldown) {
        await conn.rollback()
        conn.release()
        return res.json(error(`发言冷却中，请${Math.ceil(cooldown - elapsed)}秒后再试`, 400))
      }
    }

    const [result] = await conn.query(
      'INSERT INTO debate_speech (topic_id, user_id, role, content, stance, word_count, audit_status) VALUES (?, ?, 1, ?, ?, ?, 1)',
      [topicId, userId, content, participant[0].stance, wordCount]
    )

    await conn.commit()
    res.json(success({ speechId: result.insertId, audit_status: 1 }, '发言成功'))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('发言失败:', err)
    res.json(error('发言失败', 500))
  } finally {
    conn.release()
  }
}

export const createAudienceSpeech = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { topicId } = req.params
    const { content, stance } = req.body
    const userId = req.user.userId

    if (!content || typeof content !== 'string') {
      await conn.release()
      return res.json(error('发言内容不能为空', 400))
    }

    const wordCount = content.trim().length
    if (wordCount < 10 || wordCount > 200) {
      await conn.release()
      return res.json(error('观众发言字数需在10-200字之间', 400))
    }

    if (!stance || ![1, 2].includes(parseInt(stance))) {
      await conn.release()
      return res.json(error('立场无效', 400))
    }

    await conn.beginTransaction()

    const [topic] = await conn.query(
      'SELECT status FROM debate_topic WHERE id = ? AND audit_status = 1 FOR UPDATE',
      [topicId]
    )
    if (!topic.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('话题不存在或未通过审核', 404))
    }
    if (topic[0].status !== DEBATE_STATUS.ACTIVE && topic[0].status !== DEBATE_STATUS.PENDING) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论未开始或已结束', 400))
    }

    const [participant] = await conn.query(
      'SELECT id FROM debate_participant WHERE topic_id = ? AND user_id = ?',
      [topicId, userId]
    )
    if (participant.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩手不能以观众身份发言', 403))
    }

    const [result] = await conn.query(
      'INSERT INTO debate_speech (topic_id, user_id, role, content, stance, word_count, audit_status) VALUES (?, ?, 2, ?, ?, ?, 1)',
      [topicId, userId, content, stance, wordCount]
    )

    await conn.commit()
    res.json(success({ speechId: result.insertId, audit_status: 1 }, '发言成功'))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('观众发言失败:', err)
    res.json(error('观众发言失败', 500))
  } finally {
    conn.release()
  }
}

export const auditSpeech = async (req, res) => {
  try {
    const { speechId } = req.params
    const { audit_status, reason } = req.body

    if (![1, 2].includes(audit_status)) {
      return res.json(error('审核状态无效', 400))
    }

    await pool.query(
      'UPDATE debate_speech SET audit_status = ? WHERE id = ?',
      [audit_status, speechId]
    )

    res.json(success({ reason: audit_status === 2 ? reason : null }, audit_status === 1 ? '审核通过' : '已驳回'))
  } catch (err) {
    console.error('审核发言失败:', err)
    res.json(error('审核发言失败', 500))
  }
}

export const closeTopic = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { topicId } = req.params
    const userId = req.user.userId

    await conn.beginTransaction()

    const [topic] = await conn.query(
      'SELECT publisher_id, status FROM debate_topic WHERE id = ? FOR UPDATE',
      [topicId]
    )
    if (!topic.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('话题不存在', 404))
    }
    if (topic[0].publisher_id !== userId) {
      await conn.rollback()
      conn.release()
      return res.json(error('仅发布者可结束辩论', 403))
    }
    if (topic[0].status !== DEBATE_STATUS.ACTIVE) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论未进行中', 400))
    }

    await conn.query('UPDATE debate_topic SET status = 2 WHERE id = ?', [topicId])

    await conn.commit()
    res.json(success(null, '辩论已结束'))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('结束辩论失败:', err)
    res.json(error('结束辩论失败', 500))
  } finally {
    conn.release()
  }
}

export const voteTopic = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { topicId } = req.params
    const { stance } = req.body
    const userId = req.user.userId

    if (!stance || ![1, 2].includes(parseInt(stance))) {
      await conn.release()
      return res.json(error('立场无效', 400))
    }

    await conn.beginTransaction()

    const [topic] = await conn.query(
      'SELECT status FROM debate_topic WHERE id = ? AND audit_status = 1 FOR UPDATE',
      [topicId]
    )
    if (!topic.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('话题不存在', 404))
    }
    if (topic[0].status !== DEBATE_STATUS.CLOSED) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论未结束，无法投票', 400))
    }

    const [voted] = await conn.query(
      'SELECT id FROM debate_user_vote WHERE topic_id = ? AND user_id = ? FOR UPDATE',
      [topicId, userId]
    )
    if (voted.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('已投过票', 400))
    }

    const [user] = await conn.query('SELECT level FROM user WHERE id = ?', [userId])
    const weight = user.length ? (user[0].level === USER_LEVEL.ADMIN ? 2.0 : (user[0].level >= USER_LEVEL.ADVANCED ? 1.5 : 1.0)) : 1.0

    await conn.query('INSERT INTO debate_vote (topic_id, user_id, stance, weight) VALUES (?, ?, ?, ?)', [topicId, userId, stance, weight])
    await conn.query('INSERT INTO debate_user_vote (topic_id, user_id) VALUES (?, ?)', [topicId, userId])

    await conn.commit()
    res.json(success(null, '投票成功'))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('投票失败:', err)
    res.json(error(err.code === 'ER_DUP_ENTRY' ? '已投过票' : '投票失败', 500))
  } finally {
    conn.release()
  }
}

export const settleTopic = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { topicId } = req.params
    const userId = req.user.userId

    await conn.beginTransaction()

    const [topic] = await conn.query(
      'SELECT publisher_id, status FROM debate_topic WHERE id = ? FOR UPDATE',
      [topicId]
    )
    if (!topic.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('话题不存在', 404))
    }
    if (topic[0].publisher_id !== userId) {
      await conn.rollback()
      conn.release()
      return res.json(error('仅发布者可结算', 403))
    }
    if (topic[0].status !== DEBATE_STATUS.CLOSED) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论未结束', 400))
    }

    const [existing] = await conn.query('SELECT id FROM debate_result WHERE topic_id = ? FOR UPDATE', [topicId])
    if (existing.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('已结算', 400))
    }

    const [votes] = await conn.query(
      'SELECT stance, SUM(weight) as weighted_votes FROM debate_vote WHERE topic_id = ? GROUP BY stance',
      [topicId]
    )

    let proVotes = 0, conVotes = 0
    votes.forEach(v => {
      if (v.stance === 1) proVotes = parseFloat(v.weighted_votes) || 0
      if (v.stance === 2) conVotes = parseFloat(v.weighted_votes) || 0
    })

    const winner = proVotes > conVotes ? 1 : (conVotes > proVotes ? 2 : null)
    const summary = winner ? `${winner === 1 ? '正方' : '反方'}获胜，加权票数 ${winner === 1 ? proVotes.toFixed(1) : conVotes.toFixed(1)}:${winner === 1 ? conVotes.toFixed(1) : proVotes.toFixed(1)}` : '平票，等待管理员评审'

    await conn.query(
      'INSERT INTO debate_result (topic_id, pro_votes, con_votes, winner, summary) VALUES (?, ?, ?, ?, ?)',
      [topicId, proVotes, conVotes, winner, summary]
    )

    await conn.commit()
    res.json(success({ pro_votes: proVotes, con_votes: conVotes, winner, summary }, '结算完成'))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('结算失败:', err)
    res.json(error(err.code === 'ER_DUP_ENTRY' ? '已结算' : '结算失败', 500))
  } finally {
    conn.release()
  }
}

export const searchTopics = async (req, res) => {
  try {
    const { keyword, category, userName, page = 1, pageSize = 10, sort = 'time' } = req.query
    const offset = (page - 1) * pageSize
    const conditions = ['dt.audit_status = 1']
    const params = []

    if (keyword) {
      conditions.push('(dt.title LIKE ? OR dt.description LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (category) {
      conditions.push('dt.category = ?')
      params.push(category)
    }
    if (userName) {
      conditions.push('u.name LIKE ?')
      params.push(`%${userName}%`)
    }

    const whereClause = conditions.join(' AND ')

    const sortMap = {
      time: 'dt.created_at DESC',
      heat: 'heat DESC',
      participants: 'participant_count DESC'
    }
    const orderBy = sortMap[sort] || sortMap.time

    const [rows] = await pool.query(
      `SELECT dt.*, u.name as publisher_name,
       (SELECT COUNT(*) FROM debate_participant WHERE topic_id = dt.id) as participant_count,
       (SELECT COUNT(*) FROM debate_speech WHERE topic_id = dt.id) as heat
       FROM debate_topic dt
       LEFT JOIN user u ON dt.publisher_id = u.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM debate_topic dt LEFT JOIN user u ON dt.publisher_id = u.id WHERE ${whereClause}`,
      params
    )

    res.json(success({
      list: rows,
      total: countResult[0].total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }))
  } catch (err) {
    console.error('搜索失败:', err)
    res.json(error('搜索失败', 500))
  }
}

export const getSpeeches = async (req, res) => {
  try {
    const { topicId } = req.params
    const { role } = req.query

    let conditions = ['ds.topic_id = ?', 'ds.audit_status = 1']
    let params = [topicId]

    if (role) {
      conditions.push('ds.role = ?')
      params.push(role)
    }

    const whereClause = conditions.join(' AND ')

    const [speeches] = await pool.query(
      `SELECT ds.*, u.name as user_name
       FROM debate_speech ds
       LEFT JOIN user u ON ds.user_id = u.id
       WHERE ${whereClause}
       ORDER BY ds.created_at ASC`,
      params
    )

    res.json(success(speeches))
  } catch (err) {
    console.error('获取发言列表失败:', err)
    res.json(error('获取发言列表失败', 500))
  }
}

export const getTopicDetail = async (req, res) => {
  try {
    const { topicId } = req.params

    const [topic] = await pool.query(
      `SELECT dt.*, u.name as publisher_name
       FROM debate_topic dt
       LEFT JOIN user u ON dt.publisher_id = u.id
       WHERE dt.id = ? AND dt.audit_status = 1`,
      [topicId]
    )

    if (!topic.length) {
      return res.json(error('话题不存在', 404))
    }

    const [participants] = await pool.query(
      `SELECT dp.*, u.name as user_name
       FROM debate_participant dp
       LEFT JOIN user u ON dp.user_id = u.id
       WHERE dp.topic_id = ?`,
      [topicId]
    )

    const proCount = participants.filter(p => p.stance === 1).length
    const conCount = participants.filter(p => p.stance === 2).length

    res.json(success({
      ...topic[0],
      participants,
      proCount,
      conCount
    }))
  } catch (err) {
    console.error('获取话题详情失败:', err)
    res.json(error('获取话题详情失败', 500))
  }
}
