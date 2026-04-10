import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import { USER_LEVEL } from '../constants/userLevel.js'

export const createRuleDebate = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const userId = req.user?.userId || req.user?.id
    const { title, currentStatus, modifyContent, duration } = req.body

    if (!title || !currentStatus || !modifyContent) {
      await conn.release()
      return res.json(error('标题、当前状态和修改内容不能为空', 400))
    }

    if (title.length > 200 || modifyContent.length > 2000) {
      await conn.release()
      return res.json(error('标题或内容过长', 400))
    }

    const durationNum = parseInt(duration)
    if (!durationNum || durationNum < 1 || durationNum > 30) {
      await conn.release()
      return res.json(error('辩论时长需在1-30天之间', 400))
    }

    await conn.beginTransaction()

    const [result] = await conn.query(
      `INSERT INTO rule_debate (title, current_status, modify_content, initiator_id, status, duration)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [title, currentStatus, modifyContent, userId, durationNum]
    )

    await conn.commit()
    res.json(success({ id: result.insertId }))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('发起规则辩论失败:', err)
    res.json(error('发起规则辩论失败', 500))
  } finally {
    conn.release()
  }
}

export const getRuleDebates = async (req, res) => {
  try {
    const [debates] = await pool.query(
      `SELECT
        rd.id, rd.title, rd.status, rd.created_at,
        u.name as initiator_name,
        COUNT(DISTINCT rdp.user_id) as participant_count
       FROM rule_debate rd
       LEFT JOIN user u ON rd.initiator_id = u.id
       LEFT JOIN rule_debate_participant rdp ON rd.id = rdp.debate_id
       GROUP BY rd.id
       ORDER BY rd.created_at DESC`
    )

    res.json(success(debates))
  } catch (err) {
    console.error('获取规则辩论列表失败:', err)
    res.json(error('获取规则辩论列表失败', 500))
  }
}

export const joinRuleDebate = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const userId = req.user?.userId || req.user?.id
    const { debateId } = req.params
    const { stance } = req.body

    if (!stance || !['support', 'oppose'].includes(stance)) {
      await conn.release()
      return res.json(error('立场参数错误', 400))
    }

    await conn.beginTransaction()

    const [debate] = await conn.query(
      'SELECT status, created_at, duration FROM rule_debate WHERE id = ? FOR UPDATE',
      [debateId]
    )

    if (!debate.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论不存在', 404))
    }

    if (debate[0].status !== 'pending') {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论已结束，无法加入', 400))
    }

    const expireTime = new Date(debate[0].created_at).getTime() + debate[0].duration * 24 * 60 * 60 * 1000
    if (Date.now() > expireTime) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论已过期', 400))
    }

    const [existing] = await conn.query(
      'SELECT id FROM rule_debate_participant WHERE debate_id = ? AND user_id = ? FOR UPDATE',
      [debateId, userId]
    )

    if (existing.length > 0) {
      await conn.rollback()
      conn.release()
      return res.json(error('您已参与该辩论，不可重复选择', 400))
    }

    await conn.query(
      'INSERT INTO rule_debate_participant (debate_id, user_id, stance) VALUES (?, ?, ?)',
      [debateId, userId, stance]
    )

    await conn.commit()
    res.json(success({ message: '加入成功' }))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('加入规则辩论失败:', err)
    res.json(error(err.code === 'ER_DUP_ENTRY' ? '您已参与该辩论' : '加入规则辩论失败', 500))
  } finally {
    conn.release()
  }
}

export const createRuleDebateSpeech = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const userId = req.user?.userId || req.user?.id
    const { debateId } = req.params
    const { content } = req.body

    if (!content || typeof content !== 'string') {
      await conn.release()
      return res.json(error('发言内容不能为空', 400))
    }

    const wordCount = content.trim().length
    if (wordCount < 10 || wordCount > 1000) {
      await conn.release()
      return res.json(error('发言字数需在10-1000字之间', 400))
    }

    await conn.beginTransaction()

    const [debate] = await conn.query(
      'SELECT status, created_at, duration FROM rule_debate WHERE id = ? FOR UPDATE',
      [debateId]
    )

    if (!debate.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论不存在', 404))
    }

    if (debate[0].status !== 'pending') {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论已结束', 400))
    }

    const expireTime = new Date(debate[0].created_at).getTime() + debate[0].duration * 24 * 60 * 60 * 1000
    if (Date.now() > expireTime) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论已过期', 400))
    }

    const [participants] = await conn.query(
      'SELECT id FROM rule_debate_participant WHERE debate_id = ? AND user_id = ?',
      [debateId, userId]
    )

    if (participants.length === 0) {
      await conn.rollback()
      conn.release()
      return res.json(error('请先选择立场加入辩论', 400))
    }

    const [result] = await conn.query(
      `INSERT INTO rule_debate_speech (debate_id, user_id, content, audit_status)
       VALUES (?, ?, ?, 0)`,
      [debateId, userId, content]
    )

    await conn.commit()
    res.json(success({
      id: result.insertId,
      message: '发言已提交，等待审核'
    }))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('提交规则辩论发言失败:', err)
    res.json(error('提交规则辩论发言失败', 500))
  } finally {
    conn.release()
  }
}

export const voteRuleDebate = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const userId = req.user?.userId || req.user?.id
    const { debateId } = req.params
    const { vote } = req.body

    if (!vote || !['support', 'oppose'].includes(vote)) {
      await conn.release()
      return res.json(error('投票参数错误', 400))
    }

    await conn.beginTransaction()

    const [debate] = await conn.query(
      'SELECT status, created_at, duration FROM rule_debate WHERE id = ? FOR UPDATE',
      [debateId]
    )

    if (!debate.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论不存在', 404))
    }

    if (debate[0].status !== 'pending') {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论已结束，无法投票', 400))
    }

    const expireTime = new Date(debate[0].created_at).getTime() + debate[0].duration * 24 * 60 * 60 * 1000
    if (Date.now() > expireTime) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论已过期', 400))
    }

    const [existing] = await conn.query(
      'SELECT id FROM rule_debate_vote WHERE debate_id = ? AND user_id = ? FOR UPDATE',
      [debateId, userId]
    )

    if (existing.length > 0) {
      await conn.rollback()
      conn.release()
      return res.json(error('您已投过票，不可重复投票', 400))
    }

    const [users] = await conn.query('SELECT level FROM user WHERE id = ?', [userId])
    const level = users[0]?.level || 1
    const weight = level === 4 ? 2.00 : level === 3 ? 1.50 : level === 2 ? 1.20 : 1.00

    await conn.query(
      'INSERT INTO rule_debate_vote (debate_id, user_id, vote, weight) VALUES (?, ?, ?, ?)',
      [debateId, userId, vote, weight]
    )

    await conn.commit()
    res.json(success({ message: '投票成功' }))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('规则辩论投票失败:', err)
    res.json(error(err.code === 'ER_DUP_ENTRY' ? '您已投过票' : '规则辩论投票失败', 500))
  } finally {
    conn.release()
  }
}

export const settleRuleDebate = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const userId = req.user?.userId || req.user?.id
    const { debateId } = req.params
    const { adminDecision } = req.body

    if (!adminDecision || !['approved', 'rejected'].includes(adminDecision)) {
      await conn.release()
      return res.json(error('管理员决定参数错误', 400))
    }

    await conn.beginTransaction()

    const [debate] = await conn.query(
      'SELECT status FROM rule_debate WHERE id = ? FOR UPDATE',
      [debateId]
    )

    if (!debate.length) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论不存在', 404))
    }

    if (debate[0].status !== 'pending') {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论已结算', 400))
    }

    const [existingResult] = await conn.query(
      'SELECT id FROM rule_debate_result WHERE debate_id = ? FOR UPDATE',
      [debateId]
    )

    if (existingResult.length > 0) {
      await conn.rollback()
      conn.release()
      return res.json(error('辩论已结算', 400))
    }

    const [votes] = await conn.query(
      `SELECT vote, SUM(weight) as total_weight
       FROM rule_debate_vote
       WHERE debate_id = ?
       GROUP BY vote`,
      [debateId]
    )

    const supportWeight = parseFloat(votes.find(v => v.vote === 'support')?.total_weight) || 0
    const opposeWeight = parseFloat(votes.find(v => v.vote === 'oppose')?.total_weight) || 0
    const voteDecision = supportWeight > opposeWeight ? 'approved' : 'rejected'

    const finalDecision = voteDecision === adminDecision ? adminDecision : 'rejected'
    
    const conclusion = `投票结果：支持${supportWeight.toFixed(1)}，反对${opposeWeight.toFixed(1)}。管理员决定：${adminDecision === 'approved' ? '通过' : '拒绝'}。最终判定：${finalDecision === 'approved' ? '通过修改' : '拒绝修改'}。`

    await conn.query(
      `INSERT INTO rule_debate_result (debate_id, final_decision, support_weight, oppose_weight, admin_decision, conclusion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [debateId, finalDecision, supportWeight, opposeWeight, adminDecision, conclusion]
    )

    await conn.query(
      'UPDATE rule_debate SET status = ? WHERE id = ?',
      [finalDecision, debateId]
    )

    await conn.commit()
    res.json(success({ finalDecision, conclusion }))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('判定规则辩论失败:', err)
    res.json(error(err.code === 'ER_DUP_ENTRY' ? '辩论已结算' : '判定规则辩论失败', 500))
  } finally {
    conn.release()
  }
}
