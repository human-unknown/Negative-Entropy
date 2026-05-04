import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

/**
 * 获取当前用户的通知列表
 * GET /api/notification
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId
    const { page = 1, limit = 20, unreadOnly } = req.query
    const offset = (page - 1) * limit

    const conditions = ['n.user_id = ?']
    const params = [userId]

    if (unreadOnly === 'true' || unreadOnly === '1') {
      conditions.push('n.is_read = 0')
    }

    const whereClause = conditions.join(' AND ')

    const [rows] = await pool.query(
      `SELECT n.id, n.type, n.content, n.is_read, n.created_at
       FROM notification n
       WHERE ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    )

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM notification n WHERE ${whereClause}`,
      params
    )

    res.json(success({
      list: rows,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit)
    }))
  } catch (err) {
    console.error('获取通知列表失败:', err)
    res.json(error('获取通知列表失败', 500))
  }
}

/**
 * 获取未读通知数量
 * GET /api/notification/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId

    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM notification WHERE user_id = ? AND is_read = 0',
      [userId]
    )

    res.json(success({ count: rows[0].count }))
  } catch (err) {
    console.error('获取未读通知数失败:', err)
    res.json(error('获取失败', 500))
  }
}

/**
 * 标记单条通知为已读
 * PUT /api/notification/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId
    const { id } = req.params

    const [result] = await pool.query(
      'UPDATE notification SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    )

    if (result.affectedRows === 0) {
      return res.json(error('通知不存在', 404))
    }

    res.json(success(null, '已标记为已读'))
  } catch (err) {
    console.error('标记已读失败:', err)
    res.json(error('操作失败', 500))
  }
}

/**
 * 标记全部通知为已读
 * PUT /api/notification/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId

    await pool.query(
      'UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    )

    res.json(success(null, '全部标记为已读'))
  } catch (err) {
    console.error('全部标记已读失败:', err)
    res.json(error('操作失败', 500))
  }
}
