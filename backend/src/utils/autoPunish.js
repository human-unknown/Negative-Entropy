import pool from '../config/database.js'
import { PUNISHMENT_TYPE, PUNISHMENT_DURATION } from '../constants/punishment.js'

export const executePunishment = async (userId, violationType, content, isSevere = false) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [history] = await conn.query(
      'SELECT COUNT(*) as count FROM user_violation WHERE user_id = ?',
      [userId]
    )

    let punishmentType = PUNISHMENT_TYPE.WARNING
    if (isSevere || history[0].count >= 3) {
      punishmentType = PUNISHMENT_TYPE.BAN
    } else if (history[0].count >= 1) {
      punishmentType = PUNISHMENT_TYPE.MUTE_7D
    }

    const [violationResult] = await conn.query(
      'INSERT INTO user_violation (user_id, type, content) VALUES (?, ?, ?)',
      [userId, punishmentType, content]
    )

    const duration = PUNISHMENT_DURATION[punishmentType] * 24 * 60
    const expireAt = duration > 0 ? new Date(Date.now() + duration * 60 * 1000) : null

    await conn.query(
      'INSERT INTO user_punish (user_id, violation_id, type, duration, expire_at) VALUES (?, ?, ?, ?, ?)',
      [userId, violationResult.insertId, punishmentType, duration, expireAt]
    )

    if (punishmentType === PUNISHMENT_TYPE.BAN) {
      await conn.query('UPDATE user SET status = 0 WHERE id = ?', [userId])
    }

    await conn.commit()
    return { punishmentType, duration }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}
