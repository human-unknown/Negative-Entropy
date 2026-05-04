import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

/**
 * 获取规则列表
 * GET /api/admin/rules
 */
export const getRules = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, content, version, updated_at FROM platform_rule WHERE is_deleted = 0 ORDER BY id'
    )
    res.json(success({ list: rows, count: rows.length }))
  } catch (err) {
    console.error('获取规则列表失败:', err)
    res.json(error('获取规则列表失败'))
  }
}

/**
 * 创建或更新规则
 * POST /api/admin/rules
 * body: { id?, title, content }
 * - 带 id → 更新已有规则（version +1）
 * - 不带 id → 创建新规则
 */
export const saveRule = async (req, res) => {
  const { id, title, content } = req.body

  if (!title || !content) {
    return res.json(error('标题和内容不能为空', 400))
  }

  try {
    if (id) {
      const [result] = await pool.query(
        'UPDATE platform_rule SET title = ?, content = ?, version = version + 1 WHERE id = ? AND is_deleted = 0',
        [title, content, id]
      )
      if (result.affectedRows === 0) {
        return res.json(error('规则不存在', 404))
      }
      res.json(success(null, '规则已更新'))
    } else {
      await pool.query(
        'INSERT INTO platform_rule (title, content) VALUES (?, ?)',
        [title, content]
      )
      res.json(success(null, '规则已创建'))
    }
  } catch (err) {
    console.error('保存规则失败:', err)
    res.json(error('保存规则失败'))
  }
}
