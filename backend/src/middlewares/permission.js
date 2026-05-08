import pool from '../config/database.js'
import { error } from '../utils/response.js'
import { LEVEL_PERMISSIONS } from '../constants/levelThresholds.js'
import { USER_LEVEL } from '../constants/userLevel.js'

export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.id

      if (!userId) {
        return res.status(401).json(error('未认证', 401))
      }

      const [users] = await pool.query(
        'SELECT level FROM user WHERE id = ?',
        [userId]
      )

      if (!users.length) {
        return res.status(403).json(error('用户不存在', 403))
      }

      const { level } = users[0]
      const permissions = LEVEL_PERMISSIONS[level] || []

      if (!permissions.includes(requiredPermission)) {
        return res.status(403).json(error('权限不足', 403))
      }

      req.user.level = level
      next()
    } catch (err) {
      res.status(500).json(error('权限校验失败', 500))
    }
  }
}

export const requireLevel = (minLevel) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.id

      if (!userId) {
        return res.status(401).json(error('未认证', 401))
      }

      const [users] = await pool.query(
        'SELECT level FROM user WHERE id = ?',
        [userId]
      )

      if (!users.length) {
        return res.status(403).json(error('用户不存在', 403))
      }

      if (users[0].level < minLevel) {
        return res.status(403).json(error('等级不足', 403))
      }

      req.user.level = users[0].level
      next()
    } catch (err) {
      res.status(500).json(error('权限校验失败', 500))
    }
  }
}

export const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id

    if (!userId) {
      return res.status(401).json(error('未认证', 401))
    }

    const [users] = await pool.query(
      'SELECT level FROM user WHERE id = ?',
      [userId]
    )

    if (!users.length || users[0].level !== USER_LEVEL.ADMIN) {
      return res.status(403).json(error('仅管理员可访问', 403))
    }

    req.user.level = users[0].level
    next()
  } catch (err) {
    res.status(500).json(error('权限校验失败', 500))
  }
}

/**
 * requireCanPost — 发帖/评论权限守卫
 * 用户必须通过逻辑测试（user_check.status = 'passed'）OR 等级 >= 2
 * 这是从"辩论准入"改造为"社区发言准入"的核心中间件
 */
export const requireCanPost = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id

    if (!userId) {
      return res.status(401).json(error('未认证', 401))
    }

    // 管理员豁免
    const [users] = await pool.query('SELECT level FROM user WHERE id = ?', [userId])
    if (!users.length) {
      return res.status(403).json(error('用户不存在', 403))
    }
    if (users[0].level >= USER_LEVEL.ADMIN) {
      req.user.level = users[0].level
      return next()
    }

    // 检查是否通过逻辑测试
    const [checks] = await pool.query(
      'SELECT status FROM user_check WHERE user_id = ? AND status = 1',
      [userId]
    )

    if (!checks.length) {
      return res.status(403).json(error('请先通过逻辑测试考核才能发言', 403))
    }

    req.user.level = users[0].level
    next()
  } catch (err) {
    res.status(500).json(error('权限校验失败', 500))
  }
}
