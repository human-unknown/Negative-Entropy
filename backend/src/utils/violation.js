import pool from '../config/database.js'
import { VIOLATION_LEVEL, VIOLATION_PUNISHMENT_MAP, PUNISHMENT_DURATION } from '../constants/punishment.js'

export const recordViolation = async (userId, violationType, content, level = VIOLATION_LEVEL.MINOR) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [violationResult] = await conn.query(
      'INSERT INTO user_violation (user_id, type, content) VALUES (?, ?, ?)',
      [userId, level, content]
    )

    const punishmentType = VIOLATION_PUNISHMENT_MAP[level]
    const duration = PUNISHMENT_DURATION[punishmentType] * 24 * 60
    const expireAt = duration > 0 ? new Date(Date.now() + duration * 60 * 1000) : null

    await conn.query(
      'INSERT INTO user_punish (user_id, violation_id, type, duration, expire_at) VALUES (?, ?, ?, ?, ?)',
      [userId, violationResult.insertId, punishmentType, duration, expireAt]
    )

    if (punishmentType === 6) {
      await conn.query('UPDATE user SET status = 0 WHERE id = ?', [userId])
    }

    await conn.commit()
    return { success: true, punishmentType, duration }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

export const checkUserViolationHistory = async (userId) => {
  const [violations] = await pool.query(
    'SELECT COUNT(*) as count, MAX(created_at) as last_violation FROM user_violation WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)',
    [userId]
  )
  return violations[0]
}

export const autoEscalateViolation = async (userId, violationType, content) => {
  const history = await checkUserViolationHistory(userId)
  
  let level = VIOLATION_LEVEL.MINOR
  if (history.count >= 5) {
    level = VIOLATION_LEVEL.CRITICAL
  } else if (history.count >= 3) {
    level = VIOLATION_LEVEL.SEVERE
  } else if (history.count >= 1) {
    level = VIOLATION_LEVEL.MODERATE
  }

  return await recordViolation(userId, violationType, content, level)
}
