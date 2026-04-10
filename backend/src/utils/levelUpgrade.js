import pool from '../config/database.js'
import { LEVEL_THRESHOLDS } from '../constants/levelThresholds.js'

export const checkAndUpgradeLevel = async (userId, conn) => {
  const [users] = await conn.query(
    'SELECT exp, level FROM user WHERE id = ?',
    [userId]
  )

  if (!users.length) return

  const { exp, level: currentLevel } = users[0]
  let newLevel = currentLevel

  for (const [level, threshold] of Object.entries(LEVEL_THRESHOLDS)) {
    if (exp >= threshold && parseInt(level) > currentLevel) {
      newLevel = parseInt(level)
    }
  }

  if (newLevel > currentLevel) {
    await conn.query(
      'UPDATE user SET level = ? WHERE id = ?',
      [newLevel, userId]
    )
  }

  return newLevel
}
