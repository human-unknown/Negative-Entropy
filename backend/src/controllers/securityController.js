import bcrypt from 'bcryptjs'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import {
  setVerificationCode,
  getVerificationCode,
  deleteVerificationCode,
  CODE_PREFIX_RESET,
  CODE_PREFIX_2FA,
} from '../config/redis.js'

// 模拟用户数据（仅用于数据库不可用时的降级测试）
const mockUsers = new Map([
  ['13800138000', { id: 1, phone: '13800138000', email: 'test@example.com', password: '' }],
  ['test@example.com', { id: 1, phone: '13800138000', email: 'test@example.com', password: '' }],
])

/** 生成 6 位随机验证码 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/** 发送找回密码验证码 */
export const sendResetCode = async (req, res) => {
  const { account } = req.body

  if (!account) {
    return res.json(error('账号不能为空', 400))
  }

  try {
    let user = null

    try {
      const [users] = await pool.query(
        'SELECT id, phone, email FROM user WHERE (phone = ? OR email = ?) AND is_deleted = 0',
        [account, account],
      )
      if (users.length > 0) {
        user = users[0]
      }
    } catch (dbErr) {
      console.log('数据库未连接，使用模拟数据')
      user = mockUsers.get(account)
    }

    if (!user) {
      return res.json(error('账号不存在', 404))
    }

    const code = generateCode()
    await setVerificationCode(`${CODE_PREFIX_RESET}${account}`, code, 600)

    // 生产环境应接入短信/邮件服务
    console.log(`[验证码] 重置密码 → ${account}: ${code}`)

    res.json(success({ message: '验证码已发送' }))
  } catch (err) {
    console.error('发送验证码失败:', err)
    res.json(error('发送失败', 500))
  }
}

/** 重置密码 */
export const resetPassword = async (req, res) => {
  const { account, code, newPassword } = req.body

  if (!account || !code || !newPassword) {
    return res.json(error('参数不完整', 400))
  }

  if (newPassword.length < 6) {
    return res.json(error('密码至少6个字符', 400))
  }

  try {
    const storedCode = await getVerificationCode(`${CODE_PREFIX_RESET}${account}`)

    if (!storedCode || storedCode !== code) {
      return res.json(error('验证码错误或已过期', 400))
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    try {
      // 通过 account 查找用户 ID 进行密码更新
      const [users] = await pool.query(
        'SELECT id FROM user WHERE (phone = ? OR email = ?) AND is_deleted = 0',
        [account, account],
      )
      if (users.length > 0) {
        await pool.query('UPDATE user SET password = ? WHERE id = ?', [hashedPassword, users[0].id])
      }
    } catch (dbErr) {
      console.log('数据库未连接，模拟密码更新成功')
      const mockUser = mockUsers.get(account)
      if (mockUser) mockUser.password = hashedPassword
    }

    await deleteVerificationCode(`${CODE_PREFIX_RESET}${account}`)
    res.json(success({ message: '密码重置成功' }))
  } catch (err) {
    console.error('重置密码失败:', err)
    res.json(error('重置失败', 500))
  }
}

/** 开关双重认证 */
export const enable2FA = async (req, res) => {
  const { userId, enable } = req.body

  if (!userId || enable === undefined) {
    return res.json(error('参数不完整', 400))
  }

  try {
    try {
      await pool.query('UPDATE user SET two_factor_enabled = ? WHERE id = ?', [
        enable ? 1 : 0,
        userId,
      ])
    } catch (dbErr) {
      console.log('数据库未连接，模拟双重认证设置')
    }

    res.json(
      success({
        message: enable ? '双重认证已开启' : '双重认证已关闭',
        enabled: enable,
      }),
    )
  } catch (err) {
    console.error('设置双重认证失败:', err)
    res.json(error('设置失败', 500))
  }
}

/** 验证双重认证码 */
export const verify2FA = async (req, res) => {
  const { userId, code } = req.body

  if (!userId || !code) {
    return res.json(error('参数不完整', 400))
  }

  try {
    const storedCode = await getVerificationCode(`${CODE_PREFIX_2FA}${userId}`)

    if (!storedCode || storedCode !== code) {
      return res.json(error('验证码错误或已过期', 400))
    }

    await deleteVerificationCode(`${CODE_PREFIX_2FA}${userId}`)
    res.json(success({ verified: true }))
  } catch (err) {
    console.error('验证双重认证失败:', err)
    res.json(error('验证失败', 500))
  }
}

/** 发送双重认证验证码 */
export const send2FACode = async (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.json(error('用户ID不能为空', 400))
  }

  try {
    let user = null

    try {
      const [users] = await pool.query(
        'SELECT phone, email, two_factor_enabled FROM user WHERE id = ? AND is_deleted = 0',
        [userId],
      )
      if (users.length > 0) {
        user = users[0]
      }
    } catch (dbErr) {
      console.log('数据库未连接，使用模拟数据')
      user = { phone: '13800138000', email: 'test@example.com', two_factor_enabled: true }
    }

    if (!user) {
      return res.json(error('用户不存在', 404))
    }

    if (!user.two_factor_enabled) {
      return res.json(error('未开启双重认证', 400))
    }

    const code = generateCode()
    await setVerificationCode(`${CODE_PREFIX_2FA}${userId}`, code, 300)

    const contact = user.phone || user.email
    console.log(`[验证码] 双重认证 → ${contact}: ${code}`)

    res.json(success({ message: '验证码已发送' }))
  } catch (err) {
    console.error('发送双重认证码失败:', err)
    res.json(error('发送失败', 500))
  }
}
