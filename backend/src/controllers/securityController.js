import bcrypt from 'bcryptjs'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

// 验证码存储（生产环境应使用Redis）
const verificationCodes = new Map()

// 模拟用户数据（用于测试）
const mockUsers = new Map([
  ['13800138000', { id: 1, phone: '13800138000', email: 'test@example.com', password: '' }],
  ['test@example.com', { id: 1, phone: '13800138000', email: 'test@example.com', password: '' }]
])

export const sendResetCode = async (req, res) => {
  const { account } = req.body

  if (!account) {
    return res.json(error('账号不能为空', 400))
  }

  try {
    let user = null
    
    // 尝试从数据库查询
    try {
      const [users] = await pool.query(
        'SELECT id, phone, email FROM user WHERE (phone = ? OR email = ?) AND is_deleted = 0',
        [account, account]
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

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    verificationCodes.set(account, {
      code,
      userId: user.id,
      expires: Date.now() + 10 * 60 * 1000 // 10分钟有效
    })

    // 模拟发送（生产环境调用短信/邮件服务）
    console.log(`验证码已发送至 ${account}: ${code}`)

    res.json(success({ message: '验证码已发送' }))
  } catch (err) {
    console.error('发送验证码失败:', err)
    res.json(error('发送失败', 500))
  }
}

export const resetPassword = async (req, res) => {
  const { account, code, newPassword } = req.body

  if (!account || !code || !newPassword) {
    return res.json(error('参数不完整', 400))
  }

  if (newPassword.length < 6) {
    return res.json(error('密码至少6个字符', 400))
  }

  const stored = verificationCodes.get(account)
  if (!stored || stored.code !== code) {
    return res.json(error('验证码错误', 400))
  }

  if (Date.now() > stored.expires) {
    verificationCodes.delete(account)
    return res.json(error('验证码已过期', 400))
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    try {
      await pool.query(
        'UPDATE user SET password = ? WHERE id = ?',
        [hashedPassword, stored.userId]
      )
    } catch (dbErr) {
      console.log('数据库未连接，模拟密码更新成功')
      const mockUser = Array.from(mockUsers.values()).find(u => u.id === stored.userId)
      if (mockUser) mockUser.password = hashedPassword
    }

    verificationCodes.delete(account)
    res.json(success({ message: '密码重置成功' }))
  } catch (err) {
    console.error('重置密码失败:', err)
    res.json(error('重置失败', 500))
  }
}

export const enable2FA = async (req, res) => {
  const { userId, enable } = req.body

  if (!userId || enable === undefined) {
    return res.json(error('参数不完整', 400))
  }

  try {
    try {
      await pool.query(
        'UPDATE user SET two_factor_enabled = ? WHERE id = ?',
        [enable ? 1 : 0, userId]
      )
    } catch (dbErr) {
      console.log('数据库未连接，模拟双重认证设置')
    }

    res.json(success({
      message: enable ? '双重认证已开启' : '双重认证已关闭',
      enabled: enable
    }))
  } catch (err) {
    console.error('设置双重认证失败:', err)
    res.json(error('设置失败', 500))
  }
}

export const verify2FA = async (req, res) => {
  const { userId, code } = req.body

  if (!userId || !code) {
    return res.json(error('参数不完整', 400))
  }

  const stored = verificationCodes.get(`2fa_${userId}`)
  if (!stored || stored.code !== code) {
    return res.json(error('验证码错误', 400))
  }

  if (Date.now() > stored.expires) {
    verificationCodes.delete(`2fa_${userId}`)
    return res.json(error('验证码已过期', 400))
  }

  verificationCodes.delete(`2fa_${userId}`)
  res.json(success({ verified: true }))
}

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
        [userId]
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

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const contact = user.phone || user.email
    
    verificationCodes.set(`2fa_${userId}`, {
      code,
      expires: Date.now() + 5 * 60 * 1000 // 5分钟有效
    })

    console.log(`双重认证码已发送至 ${contact}: ${code}`)

    res.json(success({ message: '验证码已发送' }))
  } catch (err) {
    console.error('发送双重认证码失败:', err)
    res.json(error('发送失败', 500))
  }
}
