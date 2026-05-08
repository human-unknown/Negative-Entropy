import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

/**
 * 帖子可见性计算
 * 规则：基于作者等级和评论质量分。如果有管理员干预（置顶/加精），以管理员为准。
 */
const computeVisibility = (post) => {
  // 管理员置顶 → 始终可见
  if (post.is_pinned) return true

  // 审核未通过 → 不可见（除作者和管理员外）
  if (post.audit_status !== 1) return false

  // 已删除 → 不可见
  if (post.status === 2) return false

  // 有质量分且 >= 门槛 → 可见
  if (post.quality_score !== null && post.quality_score >= 3.0) return true

  // 评论数足够多 + 作者等级 >= 2 → 可见
  if (post.comment_count >= 3 && post.author_level >= 2) return true

  // 默认可见（新帖子给机会）
  return true
}

/**
 * GET /api/posts — 帖子列表（首页信息流）
 * 查询参数：channel, sort(quality|newest|hot), page, limit, keyword
 */
export const getPosts = async (req, res) => {
  try {
    const {
      channel,
      sort = 'quality',
      page = 1,
      limit = 20,
      keyword
    } = req.query

    const offset = (parseInt(page) - 1) * parseInt(limit)
    const conditions = ['p.status != 2', 'p.audit_status != 2']
    const params = []

    if (channel) {
      conditions.push('c.slug = ?')
      params.push(channel)
    }
    if (keyword) {
      conditions.push('(p.title LIKE ? OR p.content LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const whereClause = conditions.join(' AND ')

    const sortMap = {
      quality: 'p.quality_score DESC NULLS LAST, p.created_at DESC',
      newest: 'p.created_at DESC',
      hot: '(p.comment_count * 2 + p.view_count * 0.1) DESC, p.created_at DESC'
    }
    const orderClause = sortMap[sort] || sortMap.quality

    // 连表查询获取作者等级
    const sql = `
      SELECT p.*, u.name AS author_name, u.level AS author_level,
             c.name AS channel_name, c.slug AS channel_slug, c.icon AS channel_icon
      FROM post p
      JOIN user u ON p.author_id = u.id
      JOIN channel c ON p.channel_id = c.id
      WHERE ${whereClause}
      ORDER BY p.is_pinned DESC, ${orderClause}
      LIMIT ? OFFSET ?
    `

    const countSql = `
      SELECT COUNT(*) AS total
      FROM post p
      JOIN channel c ON p.channel_id = c.id
      WHERE ${whereClause}
    `

    const [rows] = await pool.query(sql, [...params, parseInt(limit), offset])
    const [countResult] = await pool.query(countSql, params)

    // 非管理员只看可见帖子
    const isAdmin = req.user?.level >= 4
    const posts = isAdmin
      ? rows
      : rows.filter(r => computeVisibility(r))

    res.json(success({
      posts,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: offset + posts.length < countResult[0].total
    }))
  } catch (err) {
    console.error('获取帖子列表失败:', err)
    res.json(error('获取帖子列表失败', 500))
  }
}

/**
 * GET /api/posts/:postId — 帖子详情
 */
export const getPostDetail = async (req, res) => {
  try {
    const { postId } = req.params

    const [rows] = await pool.query(
      `SELECT p.*, u.name AS author_name, u.level AS author_level,
              c.name AS channel_name, c.slug AS channel_slug, c.icon AS channel_icon
       FROM post p
       JOIN user u ON p.author_id = u.id
       JOIN channel c ON p.channel_id = c.id
       WHERE p.id = ?`,
      [postId]
    )

    if (!rows.length) {
      return res.status(404).json(error('帖子不存在', 404))
    }

    // 增加浏览量
    await pool.query('UPDATE post SET view_count = view_count + 1 WHERE id = ?', [postId])

    res.json(success(rows[0]))
  } catch (err) {
    console.error('获取帖子详情失败:', err)
    res.json(error('获取帖子详情失败', 500))
  }
}

/**
 * 帖子字段验证
 */
const validatePostFields = (channel_id, title, content) => {
  if (!channel_id || !title || !content) {
    return '频道、标题和内容不能为空'
  }
  if (title.length > 200) {
    return '标题不能超过200字'
  }
  if (content.length < 10) {
    return '内容至少10字'
  }
  return null
}

/**
 * POST /api/posts — 创建帖子
 * 需要 Lv2+（通过逻辑测试）
 */
export const createPost = async (req, res) => {
  let conn
  try {
    const { channel_id, title, content, thesis, premises, sources } = req.body

    const validationError = validatePostFields(channel_id, title, content)
    if (validationError) {
      return res.status(400).json(error(validationError, 400))
    }

    const userId = req.user.userId || req.user.id

    conn = await pool.getConnection()

    const [result] = await conn.query(
      `INSERT INTO post (channel_id, author_id, title, content, thesis, premises, sources)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        channel_id,
        userId,
        title.trim(),
        content.trim(),
        thesis || null,
        premises ? JSON.stringify(premises) : null,
        sources ? JSON.stringify(sources) : null
      ]
    )

    // 更新频道帖子计数
    await conn.query(
      'UPDATE channel SET post_count = post_count + 1 WHERE id = ?',
      [channel_id]
    )

    conn.release()

    const [post] = await pool.query(
      `SELECT p.*, u.name AS author_name, u.level AS author_level,
              c.name AS channel_name, c.slug AS channel_slug
       FROM post p
       JOIN user u ON p.author_id = u.id
       JOIN channel c ON p.channel_id = c.id
       WHERE p.id = ?`,
      [result.insertId]
    )

    res.status(201).json(success(post[0], '发帖成功'))
  } catch (err) {
    if (conn) conn.release()
    console.error('创建帖子失败:', err)
    res.json(error('创建帖子失败', 500))
  }
}

/**
 * 构建更新字段列表
 */
const buildUpdateFields = (body) => {
  const updates = []
  const params = []
  const fields = [
    { key: 'title', validate: (v) => v.length <= 200 || '标题不能超过200字', transform: (v) => v.trim() },
    { key: 'content', validate: (v) => v.length >= 10 || '内容至少10字', transform: (v) => v.trim() },
    { key: 'thesis', validate: null, transform: (v) => v || null },
    { key: 'premises', validate: null, transform: (v) => v ? JSON.stringify(v) : null },
    { key: 'sources', validate: null, transform: (v) => v ? JSON.stringify(v) : null }
  ]

  for (const { key, validate, transform } of fields) {
    if (body[key] !== undefined) {
      if (validate) {
        const result = validate(body[key])
        if (result !== true) return { error: result }
      }
      updates.push(`${key} = ?`)
      params.push(transform(body[key]))
    }
  }
  return { updates, params }
}

/**
 * PUT /api/posts/:postId — 编辑帖子（仅作者本人）
 */
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params
    const userId = req.user.userId || req.user.id

    const [existing] = await pool.query(
      'SELECT author_id, status FROM post WHERE id = ?',
      [postId]
    )

    if (!existing.length) {
      return res.status(404).json(error('帖子不存在', 404))
    }

    if (existing[0].author_id !== userId && req.user.level < 4) {
      return res.status(403).json(error('无权编辑他人帖子', 403))
    }

    const { updates, params, error: fieldError } = buildUpdateFields(req.body)
    if (fieldError) {
      return res.status(400).json(error(fieldError, 400))
    }

    if (!updates.length) {
      return res.status(400).json(error('没有要更新的内容', 400))
    }

    params.push(postId)
    await pool.query(
      `UPDATE post SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    const [post] = await pool.query(
      `SELECT p.*, u.name AS author_name, u.level AS author_level,
              c.name AS channel_name, c.slug AS channel_slug
       FROM post p
       JOIN user u ON p.author_id = u.id
       JOIN channel c ON p.channel_id = c.id
       WHERE p.id = ?`,
      [postId]
    )

    res.json(success(post[0], '编辑成功'))
  } catch (err) {
    console.error('编辑帖子失败:', err)
    res.json(error('编辑帖子失败', 500))
  }
}

/**
 * DELETE /api/posts/:postId — 删除帖子（作者或管理员）
 */
export const deletePost = async (req, res) => {
  let conn
  try {
    const { postId } = req.params
    const userId = req.user.userId || req.user.id

    const [existing] = await pool.query(
      'SELECT author_id, channel_id, status FROM post WHERE id = ?',
      [postId]
    )

    if (!existing.length) {
      return res.status(404).json(error('帖子不存在', 404))
    }

    if (existing[0].author_id !== userId && req.user.level < 4) {
      return res.status(403).json(error('无权删除他人帖子', 403))
    }

    conn = await pool.getConnection()

    // 软删除
    await conn.query('UPDATE post SET status = 2 WHERE id = ?', [postId])

    // 更新频道帖子计数
    await conn.query(
      'UPDATE channel SET post_count = GREATEST(post_count - 1, 0) WHERE id = ?',
      [existing[0].channel_id]
    )

    conn.release()

    res.json(success(null, '删除成功'))
  } catch (err) {
    if (conn) conn.release()
    console.error('删除帖子失败:', err)
    res.json(error('删除帖子失败', 500))
  }
}

/**
 * POST /api/posts/:postId/pin — 管理员置顶/取消置顶
 */
export const togglePin = async (req, res) => {
  try {
    const { postId } = req.params

    const [existing] = await pool.query('SELECT is_pinned FROM post WHERE id = ?', [postId])
    if (!existing.length) {
      return res.status(404).json(error('帖子不存在', 404))
    }

    const newPinned = existing[0].is_pinned ? 0 : 1
    await pool.query('UPDATE post SET is_pinned = ? WHERE id = ?', [newPinned, postId])

    res.json(success({ is_pinned: newPinned }, newPinned ? '已置顶' : '已取消置顶'))
  } catch (err) {
    console.error('置顶操作失败:', err)
    res.json(error('置顶操作失败', 500))
  }
}

/**
 * POST /api/posts/:postId/debate — Lv3+ 将帖子升级为辩论
 */
export const startDebateFromPost = async (req, res) => {
  let conn
  try {
    const { postId } = req.params
    const userId = req.user.userId || req.user.id

    const [posts] = await pool.query(
      'SELECT id, title, content, debate_id, status FROM post WHERE id = ?',
      [postId]
    )

    if (!posts.length) {
      return res.status(404).json(error('帖子不存在', 404))
    }

    const post = posts[0]

    // 已有辩论关联
    if (post.debate_id) {
      return res.status(400).json(error('该帖子已关联辩论', 400))
    }

    conn = await pool.getConnection()

    // 创建关联辩论
    const [result] = await conn.query(
      `INSERT INTO debate_topic (post_id, title, description, category, publisher_id, status)
       VALUES (?, ?, ?, '综合', ?, 0)`,
      [post.id, `[辩论] ${post.title}`, post.content, userId]
    )

    // 回写帖子
    await conn.query('UPDATE post SET debate_id = ? WHERE id = ?', [result.insertId, post.id])

    conn.release()

    const [debate] = await pool.query(
      'SELECT * FROM debate_topic WHERE id = ?',
      [result.insertId]
    )

    // 通知帖子作者
    if (post.author_id !== userId) {
      await pool.query(
        'INSERT INTO notification (user_id, type, content) VALUES (?, ?, ?)',
        [post.author_id, 'debate_started', `你的帖子"${post.title}"已升级为辩论`]
      )
    }

    res.status(201).json(success(debate[0], '辩论已创建'))
  } catch (err) {
    if (conn) conn.release()
    console.error('创建辩论失败:', err)
    res.json(error('创建辩论失败', 500))
  }
}

/**
 * POST /api/posts/:postId/score — Lv2+ 质量评分
 * 评分维度：逻辑、证据、表达、深度
 */
export const scorePost = async (req, res) => {
  try {
    const { postId } = req.params
    const { logic, evidence, expression, depth } = req.body
    const userId = req.user.userId || req.user.id

    // 验证分数范围
    const scores = { logic, evidence, expression, depth }
    for (const [key, val] of Object.entries(scores)) {
      if (val === undefined || val < 1 || val > 10) {
        return res.status(400).json(error(`${key} 评分需在1-10之间`, 400))
      }
    }

    const [posts] = await pool.query('SELECT id, quality_score FROM post WHERE id = ?', [postId])
    if (!posts.length) {
      return res.status(404).json(error('帖子不存在', 404))
    }

    // 计算综合分
    const avg = (logic + evidence + expression + depth) / 4
    const rounded = Math.round(avg * 100) / 100

    // 更新帖子质量分（取所有评分的平均）
    // 简化版：直接取新旧分数平均
    const oldScore = posts[0].quality_score
    const newScore = oldScore !== null
      ? Math.round(((oldScore + rounded) / 2) * 100) / 100
      : rounded

    await pool.query('UPDATE post SET quality_score = ? WHERE id = ?', [newScore, postId])

    // 通知帖子作者
    if (posts[0].author_id !== userId) {
      await pool.query(
        'INSERT INTO notification (user_id, type, content) VALUES (?, ?, ?)',
        [posts[0].author_id, 'post_scored', `你的帖子获得了 ${newScore} 分`]
      )
    }

    res.json(success({
      post_id: parseInt(postId),
      your_score: rounded,
      quality_score: newScore
    }, '评分成功'))
  } catch (err) {
    console.error('评分失败:', err)
    res.json(error('评分失败', 500))
  }
}
