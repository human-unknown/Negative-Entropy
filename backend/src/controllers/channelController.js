import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

/**
 * GET /api/channels — 获取所有活跃频道列表
 */
export const getChannels = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, slug, description, icon, post_count FROM channel WHERE is_active = 1 ORDER BY sort_order ASC'
    )
    res.json(success(rows))
  } catch (err) {
    console.error('获取频道列表失败:', err)
    res.json(error('获取频道列表失败', 500))
  }
}

/**
 * POST /api/channels — 管理员创建新频道
 */
export const createChannel = async (req, res) => {
  try {
    const { name, slug, description, icon } = req.body

    if (!name || !slug) {
      return res.status(400).json(error('频道名称和标识不能为空', 400))
    }

    // 检查 slug 唯一性
    const [existing] = await pool.query(
      'SELECT id FROM channel WHERE slug = ?',
      [slug]
    )
    if (existing.length) {
      return res.status(409).json(error('频道标识已存在', 409))
    }

    const [result] = await pool.query(
      'INSERT INTO channel (name, slug, description, icon) VALUES (?, ?, ?, ?)',
      [name.trim(), slug.trim().toLowerCase(), description || '', icon || '📄']
    )

    const [channel] = await pool.query(
      'SELECT id, name, slug, description, icon, post_count FROM channel WHERE id = ?',
      [result.insertId]
    )

    res.status(201).json(success(channel[0], '频道创建成功'))
  } catch (err) {
    console.error('创建频道失败:', err)
    res.json(error('创建频道失败', 500))
  }
}
