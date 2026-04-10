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
