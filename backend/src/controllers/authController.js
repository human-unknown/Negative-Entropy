import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { validationResult } from 'express-validator'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import config from '../config/app.js'

export const login = async (req, res) => {
  const { account, password } = req.body

  if (!account) {
    return res.json(error('账号不能为空', 400))
  }

  try {
    const [users] = await pool.query(
      'SELECT id, account, password, name, phone, email, level, status, created_at, two_factor_enabled FROM user WHERE (account = ? OR phone = ? OR email = ?) AND is_deleted = 0',
      [account, account, account]
    )

    if (!users.length) {
      return res.json(error('账号不存在', 404))
    }

    const user = users[0]

    if (user.status === 0) {
      return res.json(error('账号已被禁用', 403))
    }

    if (password) {
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) {
        return res.json(error('密码错误', 401))
      }
    }

    const token = jwt.sign(
      { userId: user.id, id: user.id, level: user.level },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    res.json(success({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        level: user.level,
        created_at: user.created_at,
        two_factor_enabled: !!user.two_factor_enabled
      }
    }, '登录成功'))
  } catch (err) {
    console.error('登录失败:', err)
    res.json(error('登录失败', 500))
  }
}

export const register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.json(error(errors.array()[0].msg, 400))
  }

  const { account, password, name, phone, email } = req.body

  try {
    // 检查账号是否已存在
    const [existing] = await pool.query(
      'SELECT id FROM user WHERE account = ? AND is_deleted = 0',
      [account]
    )
    if (existing.length > 0) {
      return res.json(error('账号已存在', 400))
    }

    // 检查手机号/邮箱是否已被使用
    if (phone) {
      const [phoneExists] = await pool.query(
        'SELECT id FROM user WHERE phone = ? AND is_deleted = 0',
        [phone]
      )
      if (phoneExists.length > 0) {
        return res.json(error('手机号已被使用', 400))
      }
    }
    if (email) {
      const [emailExists] = await pool.query(
        'SELECT id FROM user WHERE email = ? AND is_deleted = 0',
        [email]
      )
      if (emailExists.length > 0) {
        return res.json(error('邮箱已被使用', 400))
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 插入用户
    const [result] = await pool.query(
      'INSERT INTO user (account, password, name, phone, email) VALUES (?, ?, ?, ?, ?)',
      [account, hashedPassword, name, phone || null, email || null]
    )

    res.json(success({ userId: result.insertId }, '注册成功'))
  } catch (err) {
    console.error('注册失败:', err)
    res.json(error('注册失败', 500))
  }
}
