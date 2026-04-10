import { success, error } from '../utils/response.js'
import pool from '../config/database.js'

export const createReport = async (req, res) => {
  const { target_type, target_id, type, reason } = req.body
  const userId = req.user.userId

  if (!target_type || !target_id || !type || !reason) {
    return res.json(error('参数不完整', 400))
  }

  if (reason.trim().length < 10) {
    return res.json(error('举报理由至少10个字符', 400))
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    await conn.query(
      'INSERT INTO report (user_id, target_type, target_id, type, reason, status) VALUES (?, ?, ?, ?, ?, 0)',
      [userId, target_type, target_id, type, reason.trim()]
    )

    await conn.query(
      'INSERT INTO notification (user_id, type, content) SELECT id, "system", ? FROM user WHERE level = 4',
      [`收到新举报：${type}`]
    )

    await conn.commit()
    res.json(success({ message: '举报已提交' }))
  } catch (err) {
    await conn.rollback()
    console.error('举报提交失败:', err)
    res.json(error('提交失败', 500))
  } finally {
    conn.release()
  }
}

export const reviewReport = async (req, res) => {
  const { reportId } = req.params
  const { action, punishType, duration, reason } = req.body
  const reviewerId = req.user.userId

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.json(error('操作无效', 400))
  }

  if (action === 'approve' && !punishType) {
    return res.json(error('处理举报需要指定处罚类型', 400))
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [reports] = await conn.query(
      'SELECT id, user_id, target_type, target_id, type, reason FROM report WHERE id = ? AND status = 0',
      [reportId]
    )

    if (!reports.length) {
      await conn.rollback()
      return res.json(error('举报不存在或已处理', 404))
    }

    const report = reports[0]
    const newStatus = action === 'approve' ? 1 : 2

    await conn.query(
      'UPDATE report SET status = ?, reviewer_id = ?, review_result = ?, reviewed_at = NOW() WHERE id = ?',
      [newStatus, reviewerId, reason || null, reportId]
    )

    if (action === 'approve' && report.target_type === 'user') {
      const targetUserId = report.target_id

      const [violationResult] = await conn.query(
        'INSERT INTO user_violation (user_id, type, content, created_at) VALUES (?, ?, ?, NOW())',
        [targetUserId, report.type, report.reason]
      )

      let expireAt = null
      let durationMinutes = null

      if (punishType === 2 || punishType === 3) {
        if (duration && duration > 0) {
          durationMinutes = duration * 24 * 60
          expireAt = new Date(Date.now() + durationMinutes * 60 * 1000)
        }
      }

      await conn.query(
        'INSERT INTO user_punish (user_id, violation_id, type, duration, expire_at, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [targetUserId, violationResult.insertId, punishType, durationMinutes, expireAt]
      )

      if (punishType === 2) {
        await conn.query('UPDATE user SET status = ? WHERE id = ?', ['muted', targetUserId])
      } else if (punishType === 3) {
        await conn.query('UPDATE user SET status = ? WHERE id = ?', ['banned', targetUserId])
      }

      await conn.query(
        'INSERT INTO notification (user_id, type, content) VALUES (?, "system", ?)',
        [targetUserId, `您因${report.type}被处罚`]
      )
    }

    await conn.commit()
    res.json(success({ message: action === 'approve' ? '举报已处理' : '举报已驳回' }))
  } catch (err) {
    await conn.rollback()
    console.error('审核举报失败:', err)
    res.json(error('审核失败', 500))
  } finally {
    conn.release()
  }
}

export const getPendingReports = async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT r.id, r.target_type, r.target_id, r.type, r.reason, r.created_at,
              u.username as reporter_name
       FROM report r
       JOIN user u ON r.user_id = u.id
       WHERE r.status = 0
       ORDER BY r.created_at ASC`
    )

    res.json(success({ reports, count: reports.length }))
  } catch (err) {
    console.error('获取待审核举报失败:', err)
    res.json(error('获取失败', 500))
  }
}
