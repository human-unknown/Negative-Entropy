import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import { USER_LEVEL } from '../constants/userLevel.js'

// 评分权重映射表
const VOTER_WEIGHT_MAP = {
  [USER_LEVEL.BEGINNER]: 1.0,
  [USER_LEVEL.INTERMEDIATE]: 1.0,
  [USER_LEVEL.ADVANCED]: 1.2,
  [USER_LEVEL.ADMIN]: 1.5
}

/**
 * 提交评分
 * POST /api/debate/topics/:topicId/score
 */
export const submitScore = async (req, res) => {
  const { scores } = req.body
  const { topicId } = req.params
  const voterId = req.user?.userId

  if (!Array.isArray(scores) || scores.length === 0) {
    return res.json(error('评分数据不能为空', 400))
  }

  for (const s of scores) {
    if (![0, 1].includes(s.targetStance)) {
      return res.json(error('评分立场无效', 400))
    }
    if (!s.criterionKey || typeof s.criterionKey !== 'string') {
      return res.json(error('评分标准无效', 400))
    }
    if (typeof s.score !== 'number' || s.score < 1 || s.score > 10) {
      return res.json(error('评分需在1-10之间', 400))
    }
  }

  let conn
  try {
    conn = await pool.getConnection()
    await conn.beginTransaction()

    const [topic] = await conn.query(
      'SELECT id, status FROM debate_topic WHERE id = ? FOR UPDATE',
      [topicId]
    )
    if (!topic.length) {
      await conn.rollback()
      return res.json(error('话题不存在', 404))
    }
    if (topic[0].status !== 2) {
      await conn.rollback()
      return res.json(error('辩论未结束，无法评分', 400))
    }

    for (const s of scores) {
      await conn.query(
        `INSERT INTO debate_score (topic_id, voter_id, target_stance, criterion_key, score)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE score = VALUES(score)`,
        [topicId, voterId, s.targetStance, s.criterionKey, s.score]
      )
    }

    await conn.commit()

    // 给评分者增加经验值（静默失败）
    try {
      await pool.query(
        'INSERT INTO user_exp (user_id, amount, source, description) VALUES (?, 10, ?, ?)',
        [voterId, 'score', '辩论评分奖励']
      )
    } catch {
      // 经验值添加失败不影响评分结果
    }

    res.json(success(null, '评分已提交'))
  } catch (err) {
    if (conn) {
      await conn.rollback().catch(() => {})
    }
    console.error('提交评分失败:', err)
    res.json(error('提交评分失败', 500))
  } finally {
    if (conn) {
      conn.release()
    }
  }
}

/**
 * 获取评分结果
 * GET /api/debate/topics/:topicId/score-result
 */
export const getScoreResult = async (req, res) => {
  const { topicId } = req.params

  try {
    // 获取模板评分标准
    const [templates] = await pool.query(
      `SELECT t.config
       FROM debate_topic dt
       LEFT JOIN debate_template t ON dt.template_id = t.id
       WHERE dt.id = ?`,
      [topicId]
    )

    let criteria = ['argument', 'evidence', 'rebuttal', 'expression']
    if (templates.length && templates[0].config) {
      try {
        const config = typeof templates[0].config === 'string'
          ? JSON.parse(templates[0].config)
          : templates[0].config
        if (config.criteria && Array.isArray(config.criteria)) {
          criteria = config.criteria
        }
      } catch {
        // 配置解析失败则使用默认标准
      }
    }

    // 获取所有评分及投票者等级
    const [rows] = await pool.query(
      `SELECT ds.target_stance, ds.criterion_key, ds.score, u.level as voter_level
       FROM debate_score ds
       JOIN user u ON ds.voter_id = u.id
       WHERE ds.topic_id = ?`,
      [topicId]
    )

    if (rows.length === 0) {
      return res.json(success({
        scores: { pro: null, con: null },
        winner: null,
        criteria
      }))
    }

    // 按立场分组
    const groups = { 1: [], 0: [] }
    for (const row of rows) {
      if (groups[row.target_stance] !== undefined) {
        groups[row.target_stance].push(row)
      }
    }

    const calculateSide = (stanceRows) => {
      const voterSet = new Set()
      const breakdown = {}

      for (const criterion of criteria) {
        const criterionRows = stanceRows.filter(r => r.criterion_key === criterion)
        if (criterionRows.length === 0) continue

        let totalWeight = 0
        let weightedSum = 0

        for (const r of criterionRows) {
          const weight = VOTER_WEIGHT_MAP[r.voter_level] || 1.0
          weightedSum += r.score * weight
          totalWeight += weight
          voterSet.add(r.voter_id)
        }

        breakdown[criterion] = totalWeight > 0
          ? Math.round((weightedSum / totalWeight) * 100) / 100
          : 0
      }

      const criteriaKeys = Object.keys(breakdown)
      const total = criteriaKeys.length > 0
        ? Math.round((criteriaKeys.reduce((sum, k) => sum + breakdown[k], 0) / criteriaKeys.length) * 100) / 100
        : 0

      return { total, breakdown, voterCount: voterSet.size }
    }

    const proData = groups[1].length > 0 ? calculateSide(groups[1]) : null
    const conData = groups[0].length > 0 ? calculateSide(groups[0]) : null

    let winner = null
    if (proData && conData) {
      if (proData.total > conData.total) winner = 'pro'
      else if (conData.total > proData.total) winner = 'con'
    } else if (proData) {
      winner = 'pro'
    } else if (conData) {
      winner = 'con'
    }

    res.json(success({
      scores: { pro: proData, con: conData },
      winner,
      criteria
    }))
  } catch (err) {
    console.error('获取评分结果失败:', err)
    res.json(error('获取评分结果失败', 500))
  }
}
