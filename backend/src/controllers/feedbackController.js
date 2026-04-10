import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

export const submitFeedback = async (req, res) => {
  try {
    const { type, content, contact } = req.body
    const userId = req.user.userId

    if (!type || !content) {
      return res.json(error('反馈类型和内容不能为空', 400))
    }

    if (content.length < 10 || content.length > 1000) {
      return res.json(error('反馈内容需在10-1000字之间', 400))
    }

    await pool.query(
      'INSERT INTO feedback (user_id, type, content, contact) VALUES (?, ?, ?, ?)',
      [userId, type, content, contact || null]
    )

    res.json(success(null, '反馈提交成功'))
  } catch (err) {
    console.error('提交反馈失败:', err)
    res.json(error('提交反馈失败', 500))
  }
}
