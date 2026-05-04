import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

/**
 * 获取模板列表
 * GET /api/templates
 */
export const getTemplates = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, type, description, config FROM debate_template WHERE is_active = 1 ORDER BY id'
    )
    res.json(success(rows))
  } catch (err) {
    console.error('获取模板列表失败:', err)
    res.json(error('获取模板列表失败'))
  }
}

/**
 * 获取模板详情
 * GET /api/templates/:id
 */
export const getTemplateDetail = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, type, description, config FROM debate_template WHERE id = ? AND is_active = 1',
      [req.params.id]
    )
    if (rows.length === 0) {
      return res.json(error('模板不存在', 404))
    }
    res.json(success(rows[0]))
  } catch (err) {
    console.error('获取模板详情失败:', err)
    res.json(error('获取模板详情失败'))
  }
}

/**
 * 创建模板
 * POST /api/templates
 * body: { name, type, description?, config }
 */
export const createTemplate = async (req, res) => {
  const { name, type, description, config } = req.body

  if (!name) {
    return res.json(error('模板名称不能为空', 400))
  }
  if (!type) {
    return res.json(error('模板类型不能为空', 400))
  }
  if (!config) {
    return res.json(error('模板配置不能为空', 400))
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO debate_template (name, type, description, config) VALUES (?, ?, ?, ?)',
      [name, type, description || null, config]
    )
    res.json(success({ id: result.insertId }, '模板已创建'))
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.json(error('模板名称已存在', 400))
    }
    console.error('创建模板失败:', err)
    res.json(error('创建模板失败'))
  }
}
