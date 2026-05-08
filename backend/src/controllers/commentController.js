import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

/**
 * 递归构建评论树
 */
const buildCommentTree = (comments, parentId = null) => {
  return comments
    .filter(c => c.parent_id === parentId)
    .map(c => ({
      ...c,
      children: buildCommentTree(comments, c.id)
    }))
}

/**
 * GET /api/posts/:postId/comments — 获取评论（树形结构）
 */
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params
    const { _sort = 'quality', page = 1, limit = 50 } = req.query

    // 验证帖子存在
    const [posts] = await pool.query('SELECT id FROM post WHERE id = ?', [postId])
    if (!posts.length) {
      return res.status(404).json(error('帖子不存在', 404))
    }

    const offset = (parseInt(page) - 1) * parseInt(limit)

    const [rows] = await pool.query(
      `SELECT c.*, u.name AS author_name, u.level AS author_level
       FROM comment c
       JOIN user u ON c.author_id = u.id
       WHERE c.post_id = ? AND c.is_deleted = 0 AND c.audit_status = 1
       ORDER BY c.upvote_count DESC, c.created_at ASC
       LIMIT ? OFFSET ?`,
      [postId, parseInt(limit), offset]
    )

    // 构建树
    const tree = buildCommentTree(rows)

    res.json(success({
      comments: tree,
      page: parseInt(page),
      limit: parseInt(limit)
    }))
  } catch (err) {
    console.error('获取评论失败:', err)
    res.json(error('获取评论失败', 500))
  }
}

/**
 * POST /api/posts/:postId/comments — 发表评论
 * 需要 Lv2+
 */
export const createComment = async (req, res) => {
  let conn
  try {
    const { postId } = req.params
    const { content, parent_id, sources } = req.body
    const userId = req.user.userId || req.user.id

    if (!content || content.trim().length < 5) {
      return res.status(400).json(error('评论内容至少5字', 400))
    }

    if (content.length > 2000) {
      return res.status(400).json(error('评论不能超过2000字', 400))
    }

    // 验证父评论存在且属于同一帖子
    if (parent_id) {
      const [parents] = await pool.query(
        'SELECT id, post_id FROM comment WHERE id = ?',
        [parent_id]
      )
      if (!parents.length) {
        return res.status(404).json(error('父评论不存在', 404))
      }
      if (parents[0].post_id !== parseInt(postId)) {
        return res.status(400).json(error('父评论不属于此帖子', 400))
      }
    }

    conn = await pool.getConnection()

    const [result] = await conn.query(
      `INSERT INTO comment (post_id, author_id, parent_id, content, sources)
       VALUES (?, ?, ?, ?, ?)`,
      [
        parseInt(postId),
        userId,
        parent_id || null,
        content.trim(),
        sources ? JSON.stringify(sources) : null
      ]
    )

    // 更新帖子评论计数
    await conn.query(
      'UPDATE post SET comment_count = comment_count + 1 WHERE id = ?',
      [postId]
    )

    conn.release()

    // 通知帖子作者
    const [post] = await pool.query('SELECT author_id FROM post WHERE id = ?', [postId])
    if (post.length && post[0].author_id !== userId) {
      await pool.query(
        'INSERT INTO notification (user_id, type, content) VALUES (?, ?, ?)',
        [post[0].author_id, 'comment_reply', `${comment[0].author_name}评论了你的帖子`]
      )
    }

    const [comment] = await pool.query(
      `SELECT c.*, u.name AS author_name, u.level AS author_level
       FROM comment c
       JOIN user u ON c.author_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    )

    res.status(201).json(success(comment[0], '评论成功'))
  } catch (err) {
    if (conn) conn.release()
    console.error('发表评论失败:', err)
    res.json(error('发表评论失败', 500))
  }
}

/**
 * DELETE /api/comments/:commentId — 删除评论（作者或管理员）
 */
export const deleteComment = async (req, res) => {
  let conn
  try {
    const { commentId } = req.params
    const userId = req.user.userId || req.user.id

    const [existing] = await pool.query(
      'SELECT author_id, post_id FROM comment WHERE id = ? AND is_deleted = 0',
      [commentId]
    )

    if (!existing.length) {
      return res.status(404).json(error('评论不存在', 404))
    }

    if (existing[0].author_id !== userId && req.user.level < 4) {
      return res.status(403).json(error('无权删除他人评论', 403))
    }

    conn = await pool.getConnection()

    await conn.query('UPDATE comment SET is_deleted = 1 WHERE id = ?', [commentId])
    await conn.query(
      'UPDATE post SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = ?',
      [existing[0].post_id]
    )

    conn.release()

    res.json(success(null, '删除成功'))
  } catch (err) {
    if (conn) conn.release()
    console.error('删除评论失败:', err)
    res.json(error('删除评论失败', 500))
  }
}

/**
 * POST /api/comments/:commentId/upvote — 点赞评论
 * 需要 Lv2+
 */
export const upvoteComment = async (req, res) => {
  try {
    const { commentId } = req.params

    const [existing] = await pool.query(
      'SELECT id, upvote_count FROM comment WHERE id = ? AND is_deleted = 0',
      [commentId]
    )

    if (!existing.length) {
      return res.status(404).json(error('评论不存在', 404))
    }

    await pool.query(
      'UPDATE comment SET upvote_count = upvote_count + 1 WHERE id = ?',
      [commentId]
    )

    res.json(success({
      comment_id: parseInt(commentId),
      upvote_count: existing[0].upvote_count + 1
    }))
  } catch (err) {
    console.error('点赞失败:', err)
    res.json(error('点赞失败', 500))
  }
}
