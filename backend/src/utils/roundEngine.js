import { DEBATE_STATUS } from '../constants/debateStatus.js'

/**
 * Create all debate rounds from a template config when a structured debate starts.
 *
 * @param {import('mysql2').PoolConnection} conn - MySQL connection within a transaction
 * @param {number} topicId - debate_topic ID
 * @param {Object} templateConfig - parsed JSON.config from debate_template, must have { rounds: [...] }
 * @param {number} proUserId - user ID for the pro (正方) side
 * @param {number} conUserId - user ID for the con (反方) side
 */
export async function createRounds(conn, topicId, templateConfig, proUserId, conUserId) {
  const rounds = templateConfig.rounds

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i]
    const isFirst = i === 0
    const speakerId = round.speaker === 'pro' ? proUserId : conUserId
    const speakerStance = round.speaker === 'pro' ? 1 : 0

    await conn.query(
      `INSERT INTO debate_round
       (topic_id, round_order, round_name, speaker_stance, speaker_id, content, duration_sec, used_sec, status, started_at, ended_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, NULL)`,
      [
        topicId,
        i + 1,
        round.roundName,
        speakerStance,
        speakerId,
        round.durationSec,
        isFirst ? 'active' : 'waiting',
        isFirst ? new Date() : null
      ]
    )
  }

  await conn.query(
    'UPDATE debate_topic SET current_round = 1 WHERE id = ?',
    [topicId]
  )
}

/**
 * Advance to the next round in a structured debate.
 *
 * Locks the debate_topic row with SELECT FOR UPDATE for concurrency safety.
 *
 * @param {import('mysql2').PoolConnection} conn - MySQL connection within a transaction
 * @param {number} topicId - debate_topic ID
 * @returns {Promise<{debateComplete: boolean, message?: string, nextRound?: Object}>}
 */
export async function advanceRound(conn, topicId) {
  // Lock the topic row
  const [topicRows] = await conn.query(
    'SELECT * FROM debate_topic WHERE id = ? FOR UPDATE',
    [topicId]
  )

  if (topicRows.length === 0) {
    throw new Error('辩论话题不存在')
  }

  const topic = topicRows[0]

  if (!topic.template_id) {
    throw new Error('非模板辩论不支持轮次推进')
  }

  // Get template config
  const [templateRows] = await conn.query(
    'SELECT config FROM debate_template WHERE id = ?',
    [topic.template_id]
  )

  if (templateRows.length === 0) {
    throw new Error('辩论模板不存在')
  }

  const rawConfig = templateRows[0].config
  const templateConfig = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig

  const totalRounds = templateConfig.rounds.length
  const currentRound = topic.current_round
  const nextOrder = currentRound + 1

  if (nextOrder > totalRounds) {
    // All rounds complete — close the debate
    await conn.query(
      'UPDATE debate_topic SET status = ?, current_round = 0 WHERE id = ?',
      [DEBATE_STATUS.CLOSED, topicId]
    )
    return { debateComplete: true, message: '辩论已完成' }
  }

  // Get the next round config and figure out who should speak
  const nextRoundConfig = templateConfig.rounds[nextOrder - 1]
  const nextSpeakerStance = nextRoundConfig.speaker === 'pro' ? 1 : 0

  const [participantRows] = await conn.query(
    'SELECT user_id FROM debate_participant WHERE topic_id = ? AND stance = ?',
    [topicId, nextSpeakerStance]
  )

  const nextSpeakerId = participantRows.length > 0 ? participantRows[0].user_id : null

  // Activate the next round
  await conn.query(
    `UPDATE debate_round SET status = 'active', started_at = NOW() WHERE topic_id = ? AND round_order = ?`,
    [topicId, nextOrder]
  )

  // Update topic's current round pointer
  await conn.query(
    'UPDATE debate_topic SET current_round = ? WHERE id = ?',
    [nextOrder, topicId]
  )

  return {
    debateComplete: false,
    nextRound: {
      order: nextOrder,
      roundName: nextRoundConfig.roundName,
      speakerStance: nextSpeakerStance,
      speakerId: nextSpeakerId,
      durationSec: nextRoundConfig.durationSec
    }
  }
}

/**
 * Flip the speaking side for the active '自由辩论' (free debate) round.
 *
 * Each time a speech is submitted during free debate, this function is called
 * to switch speaker_stance and speaker_id to the opposite side.
 *
 * @param {import('mysql2').PoolConnection} conn - MySQL connection within a transaction
 * @param {number} topicId - debate_topic ID
 * @param {number} speakerStance - current speaker stance (1 = pro, 0 = con)
 */
export async function flipFreeDebateSpeaker(conn, topicId, speakerStance) {
  const nextStance = speakerStance === 1 ? 0 : 1

  // Find the participant with the opposite stance
  const [participantRows] = await conn.query(
    'SELECT user_id FROM debate_participant WHERE topic_id = ? AND stance = ?',
    [topicId, nextStance]
  )

  if (participantRows.length === 0) {
    throw new Error('未找到对方辩手')
  }

  const otherUserId = participantRows[0].user_id

  // Find the active free debate round
  const [roundRows] = await conn.query(
    `SELECT id FROM debate_round WHERE topic_id = ? AND round_name = '自由辩论' AND status = 'active'`,
    [topicId]
  )

  if (roundRows.length === 0) {
    throw new Error('未找到活跃的自由辩论轮次')
  }

  const roundId = roundRows[0].id

  await conn.query(
    `UPDATE debate_round SET speaker_stance = ?, speaker_id = ?, started_at = NOW() WHERE id = ?`,
    [nextStance, otherUserId, roundId]
  )
}
