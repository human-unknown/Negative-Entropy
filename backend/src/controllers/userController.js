import { success, error } from '../utils/response.js'
import pool from '../config/database.js'
import { checkAndUpgradeLevel } from '../utils/levelUpgrade.js'
import { LEVEL_THRESHOLDS } from '../constants/levelThresholds.js'
import { USER_LEVEL_TEXT } from '../constants/userLevel.js'

const surnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '朱', '马', '胡', '郭', '林', '何', '高', '梁', '郑', '罗', '宋', '谢', '唐', '韩', '曹', '许', '邓', '萧', '冯', '曾', '程', '蔡', '彭', '潘', '袁', '于', '董', '余', '苏', '叶', '吕', '魏', '蒋', '田', '杜', '丁', '沈', '姜', '范', '江', '傅', '钟', '卢', '汪', '戴', '崔', '任', '陆', '廖', '姚', '方', '金', '邱', '夏', '谭', '韦', '贾', '邹', '石', '熊', '孟', '秦', '阎', '薛', '侯', '雷', '白', '龙', '段', '郝', '孔', '邵', '史', '毛', '常', '万', '顾', '赖', '武', '康', '贺', '严', '尹', '钱', '施', '牛', '洪', '龚']

const invalidPatterns = [
  { regex: /[0-9]/, reason: '不得包含数字' },
  { regex: /[a-zA-Z]{2,}/, reason: '不得包含连续英文字母' },
  { regex: /[!@#$%^&*()_+=[\]{};':"\\|,.<>?/~`]/, reason: '不得包含特殊符号' },
  { regex: /(.)\1{2,}/, reason: '不得包含重复字符' },
  { regex: /^.{10,}$/, reason: '姓名过长' },
  { regex: /^.$/, reason: '姓名过短' }
]

export const validateName = (req, res) => {
  const { name } = req.body

  if (!name || !name.trim()) {
    return res.json(error('姓名不能为空', 400))
  }

  const trimmedName = name.trim()

  // 检查是否包含真实姓氏
  if (!surnames.some(s => trimmedName.startsWith(s))) {
    return res.json(success({ valid: false, reason: '必须包含真实姓氏' }))
  }

  // 检查无效模式
  for (const pattern of invalidPatterns) {
    if (pattern.regex.test(trimmedName)) {
      return res.json(success({ valid: false, reason: pattern.reason }))
    }
  }

  res.json(success({ valid: true, reason: '姓名合规' }))
}

export const addExp = async (req, res) => {
  const { userId, exp, source } = req.body

  if (!userId || !exp || !source) {
    return res.json(error('参数不完整', 400))
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    await conn.query(
      'UPDATE user SET exp = exp + ? WHERE id = ?',
      [exp, userId]
    )

    await conn.query(
      'INSERT INTO user_exp (user_id, exp, reason) VALUES (?, ?, ?)',
      [userId, exp, source]
    )

    const newLevel = await checkAndUpgradeLevel(userId, conn)

    await conn.commit()
    res.json(success({ message: '经验值增加成功', level: newLevel }))
  } catch (err) {
    await conn.rollback()
    res.json(error('经验值增加失败', 500))
  } finally {
    conn.release()
  }
}

export const updatePhone = async (req, res) => {
  const { oldPhone, newPhone, code } = req.body
  const userId = req.user.id

  if (!oldPhone || !newPhone || !code) {
    return res.json(error('参数不完整', 400))
  }

  const conn = await pool.getConnection()
  try {
    const [users] = await conn.query('SELECT phone FROM user WHERE id = ?', [userId])
    if (!users.length || users[0].phone !== oldPhone) {
      return res.json(error('原手机号不正确', 400))
    }

    const [codes] = await conn.query(
      'SELECT * FROM verification_code WHERE phone = ? AND code = ? AND type = "phone_change" AND used = 0 AND expires_at > NOW()',
      [newPhone, code]
    )
    if (!codes.length) {
      return res.json(error('验证码无效或已过期', 400))
    }

    await conn.beginTransaction()
    await conn.query('UPDATE user SET phone = ? WHERE id = ?', [newPhone, userId])
    await conn.query('UPDATE verification_code SET used = 1 WHERE id = ?', [codes[0].id])
    await conn.commit()

    res.json(success({ message: '手机号修改成功' }))
  } catch (err) {
    console.error('修改手机号失败:', err)
    try { await conn.rollback() } catch (_) { /* 连接可能已关闭 */ }
    res.json(error('修改失败', 500))
  } finally {
    conn.release()
  }
}

export const updateEmail = async (req, res) => {
  const { oldEmail, newEmail, code } = req.body
  const userId = req.user.id

  if (!oldEmail || !newEmail || !code) {
    return res.json(error('参数不完整', 400))
  }

  const conn = await pool.getConnection()
  try {
    const [users] = await conn.query('SELECT email FROM user WHERE id = ?', [userId])
    if (!users.length || users[0].email !== oldEmail) {
      return res.json(error('原邮箱不正确', 400))
    }

    const [codes] = await conn.query(
      'SELECT * FROM verification_code WHERE email = ? AND code = ? AND type = "email_change" AND used = 0 AND expires_at > NOW()',
      [newEmail, code]
    )
    if (!codes.length) {
      return res.json(error('验证码无效或已过期', 400))
    }

    await conn.beginTransaction()
    await conn.query('UPDATE user SET email = ? WHERE id = ?', [newEmail, userId])
    await conn.query('UPDATE verification_code SET used = 1 WHERE id = ?', [codes[0].id])
    await conn.commit()

    res.json(success({ message: '邮箱修改成功' }))
  } catch (err) {
    console.error('修改邮箱失败:', err)
    try { await conn.rollback() } catch (_) { /* 连接可能已关闭 */ }
    res.json(error('修改失败', 500))
  } finally {
    conn.release()
  }
}

export const getUserDebates = async (req, res) => {
  const userId = req.user.id
  const { page = 1, limit = 10 } = req.query
  const offset = (page - 1) * limit

  const conn = await pool.getConnection()
  try {
    const [debates] = await conn.query(
      `SELECT
        dt.id, dt.title, dt.status, dt.created_at,
        dp.stance,
        dr.pro_votes, dr.con_votes, dr.winner, dr.summary
      FROM debate_participant dp
      JOIN debate_topic dt ON dp.topic_id = dt.id
      LEFT JOIN debate_result dr ON dt.id = dr.topic_id
      WHERE dp.user_id = ?
      ORDER BY dt.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    )

    const [total] = await conn.query(
      'SELECT COUNT(*) as count FROM debate_participant WHERE user_id = ?',
      [userId]
    )

    res.json(success({ debates, total: total[0].count, page: parseInt(page), limit: parseInt(limit) }))
  } catch (err) {
    console.error('查询辩论历史失败:', err)
    res.json(error('查询失败', 500))
  } finally {
    conn.release()
  }
}

/**
 * 获取当前用户的经验记录
 * GET /api/user/exp
 */
export const getExpHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId
    const { page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    const [rows] = await pool.query(
      `SELECT id, exp, reason, created_at
       FROM user_exp
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    )

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM user_exp WHERE user_id = ?',
      [userId]
    )

    res.json(success({
      list: rows,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    }))
  } catch (err) {
    console.error('获取经验记录失败:', err)
    res.json(error('获取经验记录失败', 500))
  }
}

/**
 * 获取当前用户的等级信息（含晋升进度）
 * GET /api/user/level
 */
export const getLevelInfo = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId

    const [users] = await pool.query(
      'SELECT id, level, exp FROM user WHERE id = ?',
      [userId]
    )

    if (!users.length) {
      return res.json(error('用户不存在', 404))
    }

    const user = users[0]
    const currentLevel = user.level
    const currentExp = user.exp

    // 当前等级阈值
    const currentThreshold = LEVEL_THRESHOLDS[currentLevel] || 0

    // 下一级阈值
    const nextLevel = currentLevel + 1
    const nextThreshold = LEVEL_THRESHOLDS[nextLevel]

    // 晋升进度
    let progress = null
    if (nextThreshold && currentThreshold !== undefined) {
      const range = nextThreshold - currentThreshold
      const gained = currentExp - currentThreshold
      progress = range > 0 ? Math.min(Math.round((gained / range) * 100), 100) : 0
    }

    res.json(success({
      level: currentLevel,
      levelText: USER_LEVEL_TEXT[currentLevel] || '未知',
      exp: currentExp,
      currentThreshold,
      nextThreshold: nextThreshold || null,
      progress,
      nextLevelText: nextThreshold ? (USER_LEVEL_TEXT[nextLevel] || '未知') : null
    }))
  } catch (err) {
    console.error('获取等级信息失败:', err)
    res.json(error('获取等级信息失败', 500))
  }
}
