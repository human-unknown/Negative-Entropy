import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import { advanceRound, flipFreeDebateSpeaker } from '../utils/roundEngine.js'
import { DEBATE_STATUS } from '../constants/debateStatus.js'

/**
 * GET /api/debate/topics/:topicId/current-round
 * Get the currently active round for a structured debate.
 */
export const getCurrentRound = async (req, res) => {
  try {
    const { topicId } = req.params

    const [roundRows] = await pool.query(
      `SELECT dr.* FROM debate_round dr
       INNER JOIN debate_topic dt ON dr.topic_id = dt.id
       WHERE dr.topic_id = ? AND dr.status = 'active'
       LIMIT 1`,
      [topicId]
    )

    if (roundRows.length === 0) {
      // No active round — check topic state
      const [topicRows] = await pool.query(
        'SELECT status, current_round, template_id FROM debate_topic WHERE id = ?',
        [topicId]
      )

      if (topicRows.length === 0) {
        return res.json(error('话题不存在', 404))
      }

      const topic = topicRows[0]

      if (topic.status === DEBATE_STATUS.CLOSED) {
        return res.json(success({ debateComplete: true }))
      }

      if (topic.current_round === 0 && !topic.template_id) {
        return res.json(success({ isFreeDebate: true }))
      }

      return res.json(success({ waiting: true, message: '等待辩论开始' }))
    }

    const round = roundRows[0]
    const now = new Date()
    const startedAt = new Date(round.started_at)
    const elapsedSec = Math.floor((now - startedAt) / 1000)
    const remainingSec = Math.max(0, round.duration_sec - elapsedSec)

    res.json(success({
      roundId: round.id,
      roundName: round.round_name,
      order: round.round_order,
      speakerStance: round.speaker_stance,
      speakerId: round.speaker_id,
      startedAt: round.started_at,
      durationSec: round.duration_sec,
      remainingSec,
      status: round.status
    }))
  } catch (err) {
    console.error('获取当前轮次失败:', err)
    res.json(error('获取当前轮次失败', 500))
  }
}

/**
 * GET /api/debate/topics/:topicId/rounds
 * Get all rounds for a structured debate.
 */
export const getRounds = async (req, res) => {
  try {
    const { topicId } = req.params

    const [rows] = await pool.query(
      `SELECT dr.*, u.name AS speaker_name
       FROM debate_round dr
       LEFT JOIN user u ON dr.speaker_id = u.id
       WHERE dr.topic_id = ?
       ORDER BY dr.round_order`,
      [topicId]
    )

    res.json(success(rows))
  } catch (err) {
    console.error('获取轮次列表失败:', err)
    res.json(error('获取轮次列表失败', 500))
  }
}

/**
 * POST /api/debate/topics/:topicId/rounds/:roundId/submit
 * Submit a speech for the current round.
 */
export const submitRound = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { topicId, roundId } = req.params
    const { content } = req.body
    const userId = req.user.userId

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.json(error('发言内容不能为空', 400))
    }

    await conn.beginTransaction()

    const [roundRows] = await conn.query(
      'SELECT * FROM debate_round WHERE id = ? AND topic_id = ? FOR UPDATE',
      [roundId, topicId]
    )

    if (roundRows.length === 0) {
      await conn.rollback()
      return res.json(error('轮次不存在', 404))
    }

    const round = roundRows[0]

    if (round.status !== 'active') {
      await conn.rollback()
      return res.json(error('该轮次不在活跃状态', 400))
    }

    if (round.speaker_id !== userId) {
      await conn.rollback()
      return res.json(error('当前轮次不是由您发言', 403))
    }

    const now = new Date()
    const startedAt = new Date(round.started_at)
    const usedSec = Math.floor((now - startedAt) / 1000)

    if (usedSec > round.duration_sec) {
      await conn.query(
        `UPDATE debate_round
         SET content = ?, used_sec = ?, status = 'timeout', ended_at = NOW()
         WHERE id = ?`,
        [content, round.duration_sec, roundId]
      )
    } else {
      await conn.query(
        `UPDATE debate_round
         SET content = ?, used_sec = ?, status = 'completed', ended_at = NOW()
         WHERE id = ?`,
        [content, usedSec, roundId]
      )
    }

    if (round.round_name === '自由辩论') {
      await flipFreeDebateSpeaker(conn, parseInt(topicId), round.speaker_stance)
      await conn.commit()
      return res.json(success({ freeDebate: true }))
    }

    const result = await advanceRound(conn, parseInt(topicId))
    await conn.commit()

    if (result.debateComplete) {
      return res.json(success({ debateComplete: true }))
    }

    res.json(success({ nextRound: result.nextRound }))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('提交轮次发言失败:', err)
    res.json(error('提交轮次发言失败', 500))
  } finally {
    conn.release()
  }
}

/**
 * POST /api/debate/topics/:topicId/rounds/:roundId/skip
 * Skip the current round.
 */
export const skipRound = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { topicId, roundId } = req.params

    await conn.beginTransaction()

    const [roundRows] = await conn.query(
      'SELECT * FROM debate_round WHERE id = ? AND topic_id = ? FOR UPDATE',
      [roundId, topicId]
    )

    if (roundRows.length === 0) {
      await conn.rollback()
      return res.json(error('轮次不存在', 404))
    }

    if (roundRows[0].status !== 'active') {
      await conn.rollback()
      return res.json(error('该轮次不在活跃状态', 400))
    }

    await conn.query(
      "UPDATE debate_round SET status = 'skipped', ended_at = NOW() WHERE id = ?",
      [roundId]
    )

    const result = await advanceRound(conn, parseInt(topicId))
    await conn.commit()

    if (result.debateComplete) {
      return res.json(success({ debateComplete: true }))
    }

    res.json(success({ nextRound: result.nextRound }))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('跳过轮次失败:', err)
    res.json(error('跳过轮次失败', 500))
  } finally {
    conn.release()
  }
}
