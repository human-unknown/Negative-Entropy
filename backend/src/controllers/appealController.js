import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

export const submitAppeal = async (req, res) => {
  try {
    const { punishId, reason } = req.body
    const userId = req.user.userId

    if (!reason || reason.length < 10) {
      return res.json(error('申诉理由不能少于10字', 400))
    }

    const [punish] = await pool.query(
      'SELECT id FROM user_punish WHERE id = ? AND user_id = ?',
      [punishId, userId]
    )
    if (!punish.length) {
      return res.json(error('处罚记录不存在', 404))
    }

    const [existing] = await pool.query(
      'SELECT id FROM appeal WHERE punish_id = ? AND status = 0',
      [punishId]
    )
    if (existing.length) {
      return res.json(error('已提交申诉，请等待审核', 400))
    }

    await pool.query(
      'INSERT INTO appeal (user_id, punish_id, reason) VALUES (?, ?, ?)',
      [userId, punishId, reason]
    )

    res.json(success(null, '申诉提交成功'))
  } catch (err) {
    console.error('提交申诉失败:', err)
    res.json(error('提交申诉失败', 500))
  }
}

export const reviewAppeal = async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const { appealId } = req.params
    const { status, result } = req.body
    const reviewerId = req.user.userId

    if (![1, 2].includes(status)) {
      return res.json(error('审核状态无效', 400))
    }

    await conn.beginTransaction()

    const [appeal] = await conn.query(
      'SELECT user_id, punish_id FROM appeal WHERE id = ? AND status = 0',
      [appealId]
    )
    if (!appeal.length) {
      await conn.rollback()
      return res.json(error('申诉不存在或已审核', 404))
    }

    await conn.query(
      'UPDATE appeal SET status = ?, reviewer_id = ?, review_result = ?, reviewed_at = NOW() WHERE id = ?',
      [status, reviewerId, result, appealId]
    )

    if (status === 1) {
      await conn.query('DELETE FROM user_punish WHERE id = ?', [appeal[0].punish_id])
      await conn.query('UPDATE user SET status = ? WHERE id = ?', ['normal', appeal[0].user_id])
      
      await conn.query(
        'INSERT INTO notification (user_id, type, content) VALUES (?, "system", ?)',
        [appeal[0].user_id, '您的申诉已通过，处罚已撤销']
      )
    } else {
      await conn.query(
        'INSERT INTO notification (user_id, type, content) VALUES (?, "system", ?)',
        [appeal[0].user_id, `您的申诉已驳回：${result || '无'}`]
      )
    }

    await conn.commit()
    res.json(success(null, status === 1 ? '申诉通过' : '申诉驳回'))
  } catch (err) {
    await conn.rollback()
    console.error('审核申诉失败:', err)
    res.json(error('审核申诉失败', 500))
  } finally {
    conn.release()
  }
}

export const getPendingAppeals = async (req, res) => {
  try {
    const [appeals] = await pool.query(
      `SELECT a.id, a.user_id, a.punish_id, a.reason, a.created_at,
              u.name, p.type as punish_type
       FROM appeal a
       JOIN user u ON a.user_id = u.id
       JOIN user_punish p ON a.punish_id = p.id
       WHERE a.status = 0
       ORDER BY a.created_at ASC`
    )

    res.json(success({ appeals, count: appeals.length }))
  } catch (err) {
    console.error('获取待审核申诉失败:', err)
    res.json(error('获取失败', 500))
  }
}
