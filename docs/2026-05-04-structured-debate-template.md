# 结构化辩论模板 Implementation Plan

**Goal:** 为逆熵增加辩论模板系统，支持 1v1 标准赛（7轮限时发言 + 观众评分）

**Architecture:**
- 后端：新增 `debate_template` / `debate_round` / `debate_score` 三张表，`roundEngine.js` 核心轮次控制引擎，`templateController.js`/`structuredDebateController.js`/`scoreController.js` 三个控制器，改造 `debateController.js` 的 `createTopic` 和 `joinTopic`
- 前端：新增 `DebateTemplateSelector.vue` / `DebateRoundTimer.vue` / `DebateScorePanel.vue`，改造 `DebateCreate.vue` / `DebateFlow.vue`
- 数据流：创建时选模板 → 加入后自动创建轮次 → 按序发言 + 倒计时 → 自动推进 → 结束后评分

**Tech Stack:** Vue 3 + Element Plus (前端), Express.js + MySQL 8.0 (后端), native ES modules

---

## 文件总览

| 操作 | 文件 | 说明 |
|------|------|------|
| Create | `backend/sql/27_debate_template.sql` | debate_template 建表 + 初始数据 |
| Create | `backend/sql/28_debate_round.sql` | debate_round 建表 |
| Create | `backend/sql/29_debate_score.sql` | debate_score 建表 |
| Create | `backend/sql/30_debate_topic_alter.sql` | ALTER TABLE 增加 template_id / current_round |
| Create | `backend/src/controllers/templateController.js` | 模板 CRUD controller |
| Create | `backend/src/routes/templateRoutes.js` | 模板路由 |
| Create | `backend/src/utils/roundEngine.js` | 轮次推进核心引擎 |
| Create | `backend/src/controllers/structuredDebateController.js` | 轮次控制 + 发言提交 |
| Create | `backend/src/controllers/scoreController.js` | 评分控制器 |
| Create | `backend/src/routes/scoreRoutes.js` | 评分路由 |
| Modify | `backend/src/controllers/debateController.js` | createTopic/joinTopic 增加 templateId 支持 |
| Modify | `backend/src/routes/debateRoutes.js` | 注册新路由 |
| Modify | `backend/src/app.js` | 注册新路由模块 |
| Create | `frontend/src/api/template.js` | 模板相关 API |
| Create | `frontend/src/api/round.js` | 轮次相关 API |
| Create | `frontend/src/api/score.js` | 评分相关 API |
| Create | `frontend/src/components/DebateTemplateSelector.vue` | 模板选择器 |
| Create | `frontend/src/components/DebateRoundTimer.vue` | 轮次计时器 |
| Create | `frontend/src/components/DebateScorePanel.vue` | 评分面板 |
| Modify | `frontend/src/views/DebateCreate.vue` | 集成模板选择器 |
| Modify | `frontend/src/views/DebateFlow.vue` | 集成轮次系统 |
| Create | `backend/src/__tests__/roundEngine.test.js` | 轮次引擎测试 |
| Create | `backend/src/__tests__/templateController.test.js` | 模板控制器测试 |
| Create | `backend/src/__tests__/scoreController.test.js` | 评分控制器测试 |
| Create | `frontend/src/__tests__/DebateRoundTimer.test.js` | 计时器组件测试 |

---

### 阶段一：数据层 + SQL

#### Task 1: 创建 `27_debate_template.sql`

**Files:**
- Create: `backend/sql/27_debate_template.sql`

- [x] **Step 1: 写入 SQL 建表语句**

```sql
CREATE TABLE `debate_template` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `name` VARCHAR(100) NOT NULL COMMENT '模板名称，如"1v1 标准赛"',
  `type` VARCHAR(50) NOT NULL COMMENT '模板标识，如 standard_1v1',
  `description` VARCHAR(500) DEFAULT '' COMMENT '模板简要说明',
  `config` JSON NOT NULL COMMENT '轮次配置 + 评分标准 JSON',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否可用',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辩论模板';

INSERT INTO `debate_template` (`name`, `type`, `description`, `config`) VALUES
(
  '1v1 标准赛',
  'standard_1v1',
  '正反各1人，7轮次限时发言，观众评分。适合深度辩论。',
  '{"rounds":[{"order":1,"name":"正方立论","speaker":"pro","durationSec":300,"description":"正方陈述核心论点"},{"order":2,"name":"反方立论","speaker":"con","durationSec":300,"description":"反方陈述核心论点"},{"order":3,"name":"正方反驳","speaker":"pro","durationSec":240,"description":"正方反驳反方论点"},{"order":4,"name":"反方反驳","speaker":"con","durationSec":240,"description":"反方反驳正方论点"},{"order":5,"name":"自由辩论","speaker":"pro","durationSec":180,"description":"双方交替发言，正方先开始"},{"order":6,"name":"反方结辩","speaker":"con","durationSec":180,"description":"反方总结陈词"},{"order":7,"name":"正方结辩","speaker":"pro","durationSec":180,"description":"正方总结陈词"}],"scoring":{"criteria":[{"key":"argument","name":"论点说服力","description":"论点是否清晰、有逻辑、有说服力"},{"key":"evidence","name":"论证质量","description":"论据是否充分、可靠、相关"},{"key":"rebuttal","name":"反驳力度","description":"是否有效回应对方论证，发现逻辑漏洞"},{"key":"expression","name":"表达清晰度","description":"语言表达是否流畅、有条理、有感染力"}],"maxScorePerCriterion":10,"minScorePerCriterion":1}}'
);
```

#### Task 2: 创建 `28_debate_round.sql`

**Files:**
- Create: `backend/sql/28_debate_round.sql`

- [x] **Step 1: 写入 SQL 建表语句**

```sql
CREATE TABLE `debate_round` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '轮次ID',
  `topic_id` INT UNSIGNED NOT NULL COMMENT '关联辩论话题',
  `round_order` TINYINT UNSIGNED NOT NULL COMMENT '轮次序号（从1开始）',
  `round_name` VARCHAR(100) NOT NULL COMMENT '轮次名称',
  `speaker_stance` TINYINT NOT NULL COMMENT '应该谁发言：1=正方, 0=反方',
  `speaker_id` INT UNSIGNED DEFAULT NULL COMMENT '实际发言者ID（超时跳过时为NULL）',
  `content` TEXT DEFAULT NULL COMMENT '本轮发言内容',
  `duration_sec` INT UNSIGNED NOT NULL COMMENT '本轮的限定时间（秒）',
  `used_sec` INT UNSIGNED DEFAULT NULL COMMENT '实际用时（秒）',
  `status` ENUM('waiting','active','completed','timeout','skipped') NOT NULL DEFAULT 'waiting' COMMENT '轮次状态',
  `started_at` TIMESTAMP NULL DEFAULT NULL COMMENT '本轮开始时间',
  `ended_at` TIMESTAMP NULL DEFAULT NULL COMMENT '本轮结束时间',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_topic_round` (`topic_id`, `round_order`),
  KEY `idx_speaker` (`speaker_id`),
  CONSTRAINT `fk_round_topic` FOREIGN KEY (`topic_id`) REFERENCES `debate_topic` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辩论轮次记录';
```

#### Task 3: 创建 `29_debate_score.sql`

**Files:**
- Create: `backend/sql/29_debate_score.sql`

- [x] **Step 1: 写入 SQL 建表语句**

```sql
CREATE TABLE `debate_score` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '评分ID',
  `topic_id` INT UNSIGNED NOT NULL COMMENT '关联辩论话题',
  `voter_id` INT UNSIGNED NOT NULL COMMENT '评分者ID',
  `target_stance` TINYINT NOT NULL COMMENT '评分对象：1=正方, 0=反方',
  `criterion_key` VARCHAR(50) NOT NULL COMMENT '评分项标识（对应模板 scoring.criteria[].key）',
  `score` TINYINT UNSIGNED NOT NULL COMMENT '得分（1-10）',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vote` (`topic_id`, `voter_id`, `target_stance`, `criterion_key`),
  KEY `idx_topic` (`topic_id`),
  KEY `idx_voter` (`voter_id`),
  CONSTRAINT `fk_score_topic` FOREIGN KEY (`topic_id`) REFERENCES `debate_topic` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辩论评分记录';
```

#### Task 4: 创建 `30_debate_topic_alter.sql`

**Files:**
- Create: `backend/sql/30_debate_topic_alter.sql`

- [x] **Step 1: 写入 ALTER TABLE 语句**

```sql
ALTER TABLE `debate_topic`
  ADD COLUMN `template_id` INT UNSIGNED DEFAULT NULL COMMENT '关联的辩论模板ID（NULL=自由辩论）',
  ADD COLUMN `current_round` TINYINT UNSIGNED DEFAULT 0 COMMENT '当前进行到的轮次序号（0=未开始）',
  ADD KEY `idx_template` (`template_id`);
```

---

### 阶段二：后端核心逻辑

#### Task 5: 创建 `controllers/templateController.js`

**Files:**
- Create: `backend/src/controllers/templateController.js`
- Test: `backend/src/__tests__/templateController.test.js`

- [x] **Step 1: 写入 templateController**

```javascript
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

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

export const getTemplateDetail = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, type, description, config FROM debate_template WHERE id = ? AND is_active = 1',
      [req.params.id]
    )
    if (!rows.length) {
      return res.json(error('模板不存在', 404))
    }
    res.json(success(rows[0]))
  } catch (err) {
    console.error('获取模板详情失败:', err)
    res.json(error('获取模板详情失败'))
  }
}

export const createTemplate = async (req, res) => {
  const { name, type, description, config } = req.body

  if (!name || !type || !config) {
    return res.json(error('名称、类型和配置不能为空', 400))
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO debate_template (name, type, description, config) VALUES (?, ?, ?, ?)',
      [name, type, description || '', JSON.stringify(config)]
    )
    res.json(success({ id: result.insertId }, '模板已创建'))
  } catch (err) {
    console.error('创建模板失败:', err)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.json(error('模板类型已存在', 400))
    }
    res.json(error('创建模板失败'))
  }
}
```

- [x] **Step 2: 写入测试文件**

```javascript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const mockReqRes = (overrides = {}) => {
  const req = { body: {}, params: {}, ...overrides }
  const res = {
    _json: null,
    json(data) { this._json = data; return this }
  }
  return { req, res }
}

import { getTemplates, getTemplateDetail, createTemplate } from '../controllers/templateController.js'

describe('templateController - getTemplates', () => {
  it('returns error gracefully when DB is not available', async () => {
    const { req, res } = mockReqRes()
    await getTemplates(req, res)
    assert.equal(res._json.code, 500)
  })
})

describe('templateController - getTemplateDetail', () => {
  it('returns error gracefully when DB is not available', async () => {
    const { req, res } = mockReqRes({ params: { id: '1' } })
    await getTemplateDetail(req, res)
    assert.equal(res._json.code, 500)
  })
})

describe('templateController - createTemplate', () => {
  it('returns 400 when name is missing', async () => {
    const { req, res } = mockReqRes({ body: { type: 'test', config: {} } })
    await createTemplate(req, res)
    assert.equal(res._json.code, 400)
  })

  it('returns 400 when type is missing', async () => {
    const { req, res } = mockReqRes({ body: { name: 'test', config: {} } })
    await createTemplate(req, res)
    assert.equal(res._json.code, 400)
  })

  it('returns 400 when config is missing', async () => {
    const { req, res } = mockReqRes({ body: { name: 'test', type: 'test' } })
    await createTemplate(req, res)
    assert.equal(res._json.code, 400)
  })

  it('returns error gracefully when DB is not available', async () => {
    const { req, res } = mockReqRes({ body: { name: 'test', type: 'test', config: { rounds: [] } } })
    await createTemplate(req, res)
    assert.equal(res._json.code, 500)
  })
})
```

#### Task 6: 创建路由文件

**Files:**
- Create: `backend/src/routes/templateRoutes.js`

- [x] **Step 1: 写入路由文件**

```javascript
import express from 'express'
import { getTemplates, getTemplateDetail, createTemplate } from '../controllers/templateController.js'
import { auth } from '../middlewares/auth.js'
import { requireAdmin } from '../middlewares/permission.js'

const router = express.Router()

router.get('/', getTemplates)
router.get('/:id', getTemplateDetail)
router.post('/', auth, requireAdmin, createTemplate)

export default router
```

#### Task 7: 创建 `utils/roundEngine.js`（核心）

**Files:**
- Create: `backend/src/utils/roundEngine.js`
- Test: `backend/src/__tests__/roundEngine.test.js`

- [x] **Step 1: 写入轮次引擎**

```javascript
import { DEBATE_STATUS } from '../constants/debateStatus.js'

/**
 * 轮次控制引擎
 * 
 * 负责：
 * 1. 创建辩论的所有轮次（加入时调用）
 * 2. 提交发言后推进到下一轮（advanceRound）
 * 3. 最后一轮结束后自动触发辩论结束
 * 4. 自由辩论轮次的 speaker 翻转
 */

/**
 * 根据模板配置创建所有轮次
 * @param {object} conn - 数据库连接（已在事务中）
 * @param {number} topicId - 辩论话题ID
 * @param {object} templateConfig - 模板的 config JSON
 * @param {number} proUserId - 正方用户ID
 * @param {number} conUserId - 反方用户ID
 */
export const createRounds = async (conn, topicId, templateConfig, proUserId, conUserId) => {
  const { rounds } = templateConfig

  for (const round of rounds) {
    const speakerId = round.speaker === 'pro' ? proUserId : conUserId
    await conn.query(
      `INSERT INTO debate_round (topic_id, round_order, round_name, speaker_stance, speaker_id, duration_sec, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        topicId,
        round.order,
        round.name,
        round.speaker === 'pro' ? 1 : 0,
        speakerId,
        round.durationSec,
        round.order === 1 ? 'active' : 'waiting'
      ]
    )
  }

  // 激活第一轮：设置 started_at
  await conn.query(
    'UPDATE debate_round SET started_at = NOW() WHERE topic_id = ? AND round_order = 1',
    [topicId]
  )

  // 更新辩论话题的当前轮次
  await conn.query(
    'UPDATE debate_topic SET current_round = 1 WHERE id = ?',
    [topicId]
  )
}

/**
 * 推进到下一轮
 * @param {object} conn - 数据库连接（已在事务中）
 * @param {number} topicId - 辩论话题ID
 * @returns {object} { debateComplete, nextRound, message }
 */
export const advanceRound = async (conn, topicId) => {
  // 获取当前辩论信息
  const [topics] = await conn.query(
    'SELECT template_id, current_round FROM debate_topic WHERE id = ? FOR UPDATE',
    [topicId]
  )
  if (!topics.length) throw new Error(`话题 ${topicId} 不存在`)

  const topic = topics[0]
  if (!topic.template_id) throw new Error('非模板辩论不支持轮次推进')

  // 获取模板配置
  const [templates] = await conn.query(
    'SELECT config FROM debate_template WHERE id = ?',
    [topic.template_id]
  )
  if (!templates.length) throw new Error('模板不存在')

  const config = typeof templates[0].config === 'string'
    ? JSON.parse(templates[0].config)
    : templates[0].config
  const totalRounds = config.rounds.length

  const nextOrder = topic.current_round + 1

  // 最后一轮已结束
  if (nextOrder > totalRounds) {
    await conn.query(
      'UPDATE debate_topic SET status = ?, current_round = 0 WHERE id = ?',
      [DEBATE_STATUS.CLOSED, topicId]
    )
    return { debateComplete: true, message: '辩论已完成' }
  }

  // 找到下一轮配置
  const nextRoundConfig = config.rounds.find(r => r.order === nextOrder)
  if (!nextRoundConfig) throw new Error(`未找到第 ${nextOrder} 轮配置`)

  // 获取该轮对应的说话人
  const [participants] = await conn.query(
    'SELECT user_id, stance FROM debate_participant WHERE topic_id = ? AND stance IN (0, 1)',
    [topicId]
  )
  const proUser = participants.find(p => p.stance === 1)
  const conUser = participants.find(p => p.stance === 0)
  const nextSpeakerId = nextRoundConfig.speaker === 'pro'
    ? proUser?.user_id
    : conUser?.user_id

  // 更新当前轮次为 active
  await conn.query(
    'UPDATE debate_round SET status = ?, started_at = NOW() WHERE topic_id = ? AND round_order = ?',
    ['active', topicId, nextOrder]
  )

  // 更新辩论话题的当前轮次
  await conn.query(
    'UPDATE debate_topic SET current_round = ? WHERE id = ?',
    [nextOrder, topicId]
  )

  return {
    debateComplete: false,
    nextRound: {
      order: nextOrder,
      roundName: nextRoundConfig.name,
      speakerStance: nextRoundConfig.speaker === 'pro' ? 1 : 0,
      speakerId: nextSpeakerId,
      durationSec: nextRoundConfig.durationSec
    }
  }
}

/**
 * 自由辩论轮次的 speaker 翻转
 * 自由辩论时，每次提交后切换发言方
 * @param {object} conn - 数据库连接
 * @param {number} topicId - 辩论话题ID
 * @param {number} speakerStance - 当前发言方（1=正, 0=反）
 */
export const flipFreeDebateSpeaker = async (conn, topicId, speakerStance) => {
  const nextStance = speakerStance === 1 ? 0 : 1

  const [participants] = await conn.query(
    'SELECT user_id FROM debate_participant WHERE topic_id = ? AND stance = ?',
    [topicId, nextStance]
  )

  if (!participants.length) {
    // 对方不存在，跳过——由 advanceRound 处理
    return
  }

  // 获取当前自由辩论的轮次
  const [rounds] = await conn.query(
    'SELECT id FROM debate_round WHERE topic_id = ? AND status = "active" AND round_name = "自由辩论"',
    [topicId]
  )

  if (rounds.length) {
    await conn.query(
      'UPDATE debate_round SET speaker_stance = ?, speaker_id = ? WHERE id = ?',
      [nextStance, participants[0].user_id, rounds[0].id]
    )
    await conn.query(
      'UPDATE debate_round SET started_at = NOW() WHERE id = ?',
      [rounds[0].id]
    )
  }
}
```

- [x] **Step 2: 写入 roundEngine 测试**

```javascript
import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

// 导入不依赖 DB 的函数
import { advanceRound, flipFreeDebateSpeaker } from '../utils/roundEngine.js'

// Mock DEBATE_STATUS
const mockStatus = { CLOSED: 2 }

describe('roundEngine - advanceRound', () => {
  it('throws error when topic not found', async () => {
    const mockConn = {
      query: mock.fn(async () => [[]])
    }
    await assert.rejects(
      () => advanceRound(mockConn, 999),
      /话题 999 不存在/
    )
  })

  it('throws error when topic has no template', async () => {
    const mockConn = {
      query: mock.fn(async (sql, params) => {
        if (sql.includes('FROM debate_topic')) return [[{ template_id: null, current_round: 1 }]]
        return [[]]
      })
    }
    await assert.rejects(
      () => advanceRound(mockConn, 1),
      /非模板辩论不支持轮次推进/
    )
  })

  it('throws error when template config not found', async () => {
    const mockConn = {
      query: mock.fn(async (sql, params) => {
        if (sql.includes('FROM debate_topic')) return [[{ template_id: 1, current_round: 1 }]]
        if (sql.includes('FROM debate_template')) return [[]]
        return [[]]
      })
    }
    await assert.rejects(
      () => advanceRound(mockConn, 1),
      /模板不存在/
    )
  })
})
```

#### Task 8: 创建 `controllers/structuredDebateController.js`

**Files:**
- Create: `backend/src/controllers/structuredDebateController.js`

- [x] **Step 1: 写入控制器**

```javascript
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import { advanceRound, flipFreeDebateSpeaker } from '../utils/roundEngine.js'
import { DEBATE_STATUS } from '../constants/debateStatus.js'

/**
 * 获取当前活跃轮次信息
 * GET /api/debate/topics/:topicId/current-round
 */
export const getCurrentRound = async (req, res) => {
  try {
    const { topicId } = req.params

    const [rounds] = await pool.query(
      `SELECT dr.*, dt.template_id, dt.current_round
       FROM debate_round dr
       JOIN debate_topic dt ON dr.topic_id = dt.id
       WHERE dr.topic_id = ? AND dr.status = 'active'
       LIMIT 1`,
      [topicId]
    )

    if (!rounds.length) {
      // 检查辩论是否已完成
      const [topics] = await pool.query(
        'SELECT current_round, status, template_id FROM debate_topic WHERE id = ?',
        [topicId]
      )
      if (!topics.length) return res.json(error('话题不存在', 404))

      if (topics[0].status === DEBATE_STATUS.CLOSED) {
        return res.json(success({ debateComplete: true }))
      }
      if (topics[0].current_round === 0 && !topics[0].template_id) {
        return res.json(success({ isFreeDebate: true }))
      }
      return res.json(success({ waiting: true, message: '等待辩论开始' }))
    }

    const round = rounds[0]
    const now = new Date()
    const startedAt = round.started_at ? new Date(round.started_at) : now
    const elapsed = Math.floor((now - startedAt) / 1000)
    const remainingSec = Math.max(0, round.duration_sec - elapsed)

    res.json(success({
      roundId: round.id,
      roundName: round.round_name,
      order: round.round_order,
      speakerStance: round.speaker_stance,
      speakerId: round.speaker_id,
      startedAt: round.started_at,
      durationSec: round.duration_sec,
      remainingSec,
      status: round.status
    }))
  } catch (err) {
    console.error('获取当前轮次失败:', err)
    res.json(error('获取当前轮次失败'))
  }
}

/**
 * 获取辩论全部轮次记录
 * GET /api/debate/topics/:topicId/rounds
 */
export const getRounds = async (req, res) => {
  try {
    const { topicId } = req.params
    const [rows] = await pool.query(
      `SELECT dr.*, u.name as speaker_name
       FROM debate_round dr
       LEFT JOIN user u ON dr.speaker_id = u.id
       WHERE dr.topic_id = ?
       ORDER BY dr.round_order`,
      [topicId]
    )
    res.json(success(rows))
  } catch (err) {
    console.error('获取轮次列表失败:', err)
    res.json(error('获取轮次列表失败'))
  }
}

/**
 * 提交本轮发言
 * POST /api/debate/topics/:topicId/rounds/:roundId/submit
 */
export const submitRound = async (req, res) => {
  const { topicId, roundId } = req.params
  const { content } = req.body
  const userId = req.user.userId

  if (!content || !content.trim()) {
    return res.json(error('发言内容不能为空', 400))
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 获取轮次信息（加锁）
    const [rounds] = await conn.query(
      'SELECT * FROM debate_round WHERE id = ? AND topic_id = ? FOR UPDATE',
      [roundId, topicId]
    )
    if (!rounds.length) {
      await conn.rollback()
      return res.json(error('轮次不存在', 404))
    }

    const round = rounds[0]

    if (round.status !== 'active') {
      await conn.rollback()
      return res.json(error('当前轮次已不可提交', 400))
    }

    if (round.speaker_id !== userId) {
      await conn.rollback()
      return res.json(error('当前不是您的发言轮次', 403))
    }

    // 计算是否超时
    const now = new Date()
    const startedAt = round.started_at ? new Date(round.started_at) : now
    const usedSec = Math.floor((now - startedAt) / 1000)

    // 更新轮次
    if (usedSec > round.duration_sec) {
      await conn.query(
        'UPDATE debate_round SET content = ?, used_sec = ?, status = "timeout", ended_at = NOW() WHERE id = ?',
        [content.trim(), round.duration_sec, roundId]
      )
    } else {
      await conn.query(
        'UPDATE debate_round SET content = ?, used_sec = ?, status = "completed", ended_at = NOW() WHERE id = ?',
        [content.trim(), usedSec, roundId]
      )
    }

    // 检查是否是自由辩论轮次
    let freeDebateFlipped = false
    if (round.round_name === '自由辩论') {
      await flipFreeDebateSpeaker(conn, parseInt(topicId), round.speaker_stance)
      freeDebateFlipped = true
      await conn.commit()
      return res.json(success({
        roundId: parseInt(roundId),
        status: usedSec > round.duration_sec ? 'timeout' : 'completed',
        freeDebate: true,
        usedSec: Math.min(usedSec, round.duration_sec),
        message: freeDebateFlipped ? '发言已提交，等待对方发言' : '发言已提交'
      }))
    }

    // 推进到下一轮
    const result = await advanceRound(conn, parseInt(topicId))
    await conn.commit()

    if (result.debateComplete) {
      return res.json(success({
        roundId: parseInt(roundId),
        status: 'completed',
        debateComplete: true,
        message: '辩论已完成'
      }))
    }

    res.json(success({
      roundId: parseInt(roundId),
      status: 'completed',
      usedSec,
      nextRound: result.nextRound
    }))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('提交发言失败:', err)
    res.json(error('提交发言失败'))
  } finally {
    conn.release()
  }
}

/**
 * 跳过本轮（超时或主动放弃）
 * POST /api/debate/topics/:topicId/rounds/:roundId/skip
 */
export const skipRound = async (req, res) => {
  const { topicId, roundId } = req.params

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [rounds] = await conn.query(
      'SELECT * FROM debate_round WHERE id = ? AND topic_id = ? FOR UPDATE',
      [roundId, topicId]
    )
    if (!rounds.length) {
      await conn.rollback()
      return res.json(error('轮次不存在', 404))
    }

    const round = rounds[0]
    if (round.status !== 'active') {
      await conn.rollback()
      return res.json(error('当前轮次已不可跳过', 400))
    }

    // 标记为跳过
    await conn.query(
      'UPDATE debate_round SET status = "skipped", ended_at = NOW() WHERE id = ?',
      [roundId]
    )

    // 推进到下一轮
    const result = await advanceRound(conn, parseInt(topicId))
    await conn.commit()

    if (result.debateComplete) {
      return res.json(success({ debateComplete: true, message: '辩论已完成' }))
    }

    res.json(success({
      roundId: parseInt(roundId),
      status: 'skipped',
      nextRound: result.nextRound
    }))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('跳过轮次失败:', err)
    res.json(error('跳过轮次失败'))
  } finally {
    conn.release()
  }
}
```

#### Task 9: 创建 `controllers/scoreController.js`

**Files:**
- Create: `backend/src/controllers/scoreController.js`
- Test: `backend/src/__tests__/scoreController.test.js`

- [x] **Step 1: 写入评分控制器**

```javascript
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import { USER_LEVEL } from '../constants/userLevel.js'

// 评分者权重
const VOTER_WEIGHT_MAP = {
  [USER_LEVEL.BEGINNER]: 1.0,
  [USER_LEVEL.INTERMEDIATE]: 1.0,
  [USER_LEVEL.ADVANCED]: 1.2,
  [USER_LEVEL.ADMIN]: 1.5
}

/**
 * 提交评分
 * POST /api/debate/topics/:topicId/score
 * body: { scores: [{ targetStance, criterionKey, score }] }
 */
export const submitScore = async (req, res) => {
  const { topicId } = req.params
  const { scores } = req.body
  const userId = req.user.userId

  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    return res.json(error('评分数据不能为空', 400))
  }

  // 校验每个评分项
  for (const s of scores) {
    if (![0, 1].includes(s.targetStance)) {
      return res.json(error('评分对象无效', 400))
    }
    if (!s.criterionKey || typeof s.criterionKey !== 'string') {
      return res.json(error('评分项标识无效', 400))
    }
    if (typeof s.score !== 'number' || s.score < 1 || s.score > 10) {
      return res.json(error('评分必须在1-10之间', 400))
    }
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 检查辩论是否处于评分阶段
    const [topics] = await conn.query(
      'SELECT status, template_id FROM debate_topic WHERE id = ? FOR UPDATE',
      [topicId]
    )
    if (!topics.length) {
      await conn.rollback()
      return res.json(error('话题不存在', 404))
    }
    if (topics[0].status !== 2) { // CLOSED
      await conn.rollback()
      return res.json(error('辩论未结束，不能评分', 400))
    }

    for (const s of scores) {
      await conn.query(
        `INSERT INTO debate_score (topic_id, voter_id, target_stance, criterion_key, score)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE score = VALUES(score)`,
        [topicId, userId, s.targetStance, s.criterionKey, s.score]
      )
    }

    await conn.commit()

    // 给评分者少量经验
    try {
      await pool.query(
        'INSERT INTO user_exp (user_id, exp, source, description) VALUES (?, ?, ?, ?)',
        [userId, 10, 'score', '辩论评分奖励']
      )
    } catch (_) {
      // exp 记录失败不影响评分结果
    }

    res.json(success(null, '评分已提交'))
  } catch (err) {
    await conn.rollback().catch(() => {})
    console.error('提交评分失败:', err)
    res.json(error('提交评分失败'))
  } finally {
    conn.release()
  }
}

/**
 * 获取评分结果
 * GET /api/debate/topics/:topicId/score-result
 */
export const getScoreResult = async (req, res) => {
  try {
    const { topicId } = req.params

    const [scores] = await pool.query(
      `SELECT ds.*, u.level as voter_level
       FROM debate_score ds
       JOIN user u ON ds.voter_id = u.id
       WHERE ds.topic_id = ?`,
      [topicId]
    )

    if (!scores.length) {
      return res.json(success({ pro: null, con: null, winner: null }))
    }

    // 按 stance 分组加权评分
    const result = { pro: { breakdown: {}, total: 0, weightedCount: 0 }, con: { breakdown: {}, total: 0, weightedCount: 0 } }

    for (const s of scores) {
      const stanceKey = s.target_stance === 1 ? 'pro' : 'con'
      const weight = VOTER_WEIGHT_MAP[s.voter_level] || 1.0

      if (!result[stanceKey].breakdown[s.criterion_key]) {
        result[stanceKey].breakdown[s.criterion_key] = { totalScore: 0, weightSum: 0 }
      }
      result[stanceKey].breakdown[s.criterion_key].totalScore += s.score * weight
      result[stanceKey].breakdown[s.criterion_key].weightSum += weight
      result[stanceKey].weightedCount += weight
    }

    for (const stanceKey of ['pro', 'con']) {
      let totalWeighted = 0
      let criterionCount = 0
      for (const key of Object.keys(result[stanceKey].breakdown)) {
        const avg = result[stanceKey].breakdown[key].totalScore / result[stanceKey].breakdown[key].weightSum
        result[stanceKey].breakdown[key] = Math.round(avg * 10) / 10
        totalWeighted += avg
        criterionCount++
      }
      result[stanceKey].total = criterionCount > 0
        ? Math.round((totalWeighted / criterionCount) * 10) / 10
        : 0
      result[stanceKey].voterCount = scores.filter(s =>
        (stanceKey === 'pro' ? s.target_stance === 1 : s.target_stance === 0)
      ).length
    }

    let winner = null
    if (result.pro.total > result.con.total) winner = 'pro'
    else if (result.con.total > result.pro.total) winner = 'con'

    // 获取模板评分标准供前端渲染
    const [templates] = await pool.query(
      'SELECT dt.config FROM debate_topic d JOIN debate_template t ON d.template_id = t.id WHERE d.id = ?',
      [topicId]
    )
    const criteria = templates.length
      ? (typeof templates[0].config === 'string' ? JSON.parse(templates[0].config) : templates[0].config).scoring?.criteria || []
      : []

    res.json(success({ scores: result, winner, criteria }))
  } catch (err) {
    console.error('获取评分结果失败:', err)
    res.json(error('获取评分结果失败'))
  }
}
```

- [x] **Step 2: 写入评分测试**

```javascript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const mockReqRes = (overrides = {}) => {
  const req = { body: {}, params: {}, user: { userId: 1 }, ...overrides }
  const res = {
    _json: null,
    json(data) { this._json = data; return this }
  }
  return { req, res }
}

import { submitScore, getScoreResult } from '../controllers/scoreController.js'

describe('scoreController - submitScore', () => {
  it('returns 400 when scores is empty', async () => {
    const { req, res } = mockReqRes({ body: { scores: [] }, params: { topicId: '1' } })
    await submitScore(req, res)
    assert.equal(res._json.code, 400)
  })

  it('returns 400 when scores is not array', async () => {
    const { req, res } = mockReqRes({ body: { scores: 'invalid' }, params: { topicId: '1' } })
    await submitScore(req, res)
    assert.equal(res._json.code, 400)
  })

  it('returns 400 when score out of range', async () => {
    const { req, res } = mockReqRes({
      body: { scores: [{ targetStance: 1, criterionKey: 'argument', score: 15 }] },
      params: { topicId: '1' }
    })
    await submitScore(req, res)
    assert.equal(res._json.code, 400)
  })

  it('returns error gracefully when DB is not available', async () => {
    const { req, res } = mockReqRes({
      body: { scores: [{ targetStance: 1, criterionKey: 'argument', score: 8 }] },
      params: { topicId: '1' }
    })
    await submitScore(req, res)
    assert.equal(res._json.code, 500)
  })
})

describe('scoreController - getScoreResult', () => {
  it('returns error gracefully when DB is not available', async () => {
    const { req, res } = mockReqRes({ params: { topicId: '1' } })
    await getScoreResult(req, res)
    assert.equal(res._json.code, 500)
  })
})
```

#### Task 10: 创建评分路由

**Files:**
- Create: `backend/src/routes/scoreRoutes.js`

- [x] **Step 1: 写入路由**

```javascript
import express from 'express'
import { submitScore, getScoreResult } from '../controllers/scoreController.js'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.post('/topics/:topicId/score', auth, submitScore)
router.get('/topics/:topicId/score-result', getScoreResult)

export default router
```

#### Task 11: 改造 `debateController.js`

**Files:**
- Modify: `backend/src/controllers/debateController.js` — `createTopic` 和 `joinTopic`
- Modify: `backend/src/routes/debateRoutes.js` — 新路由

- [x] **Step 1: createTopic 增加 templateId 支持**

在 `createTopic` 函数中，提取 `templateId` 并校验：

在 `conn.beginTransaction()` 之前，`req.body` 解构处增加 `templateId`：
```javascript
// 原行 95:
const { title, description, category, pro_limit = 5, con_limit = 5, templateId } = req.body
```

插入话题后，如果有 `templateId`，检查模板是否存在：
```javascript
// 在 const topicId = result.insertId 之后（原行 122）
if (templateId) {
  const [templates] = await conn.query(
    'SELECT id FROM debate_template WHERE id = ? AND is_active = 1',
    [templateId]
  )
  if (!templates.length) {
    await conn.rollback()
    return res.json(error('模板不存在', 400))
  }
  // 1v1 模板自动设置限制人数
  await conn.query(
    'UPDATE debate_topic SET template_id = ?, pro_limit = 1, con_limit = 1 WHERE id = ?',
    [templateId, topicId]
  )
}
```

- [x] **Step 2: joinTopic 增加模板轮次创建逻辑**

在 `joinTopic` 的 `INSERT INTO debate_participant` 之后（原行 225），`await conn.commit()` 之前，增加：

```javascript
// 在 await conn.query('INSERT INTO debate_participant...') 之后
const [topicInfo] = await conn.query(
  'SELECT template_id FROM debate_topic WHERE id = ?',
  [topicId]
)

if (topicInfo[0].template_id) {
  // 检查双方是否都已加入
  const [participants] = await conn.query(
    'SELECT stance, user_id FROM debate_participant WHERE topic_id = ? AND stance IN (0, 1)',
    [topicId]
  )
  const proUser = participants.find(p => p.stance === 1)
  const conUser = participants.find(p => p.stance === 0)

  if (proUser && conUser) {
    // 双方已到齐，获取模板配置并创建轮次
    const [templates] = await conn.query(
      'SELECT config FROM debate_template WHERE id = ?',
      [topicInfo[0].template_id]
    )
    if (templates.length) {
      const config = typeof templates[0].config === 'string'
        ? JSON.parse(templates[0].config)
        : templates[0].config
      const { createRounds } = await import('../utils/roundEngine.js')
      await createRounds(conn, parseInt(topicId), config, proUser.user_id, conUser.user_id)
    }
  }
}
```

注意：需要动态 import 避免循环依赖。或者将 `createRounds` 放在 `joinTopic` 的 scope 中直接调用（推荐）。

改为在文件顶部 import：
```javascript
import { createRounds } from '../utils/roundEngine.js'
```

- [x] **Step 3: 修改 debateRoutes.js 挂载新路由**

```javascript
// 在路由文件中增加：
import { getCurrentRound, getRounds, submitRound, skipRound } from '../controllers/structuredDebateController.js'

// 新增路由：
router.get('/topics/:topicId/current-round', auth, getCurrentRound)
router.get('/topics/:topicId/rounds', getRounds)
router.post('/topics/:topicId/rounds/:roundId/submit', auth, submitRound)
router.post('/topics/:topicId/rounds/:roundId/skip', auth, skipRound)
```

注意：`createTopic` 和 `joinTopic` 已在同一个 controller 和 router 中，不需要额外注册。

#### Task 12: 修改 `app.js`

**Files:**
- Modify: `backend/src/app.js`

- [x] **Step 1: 注册新路由**

```javascript
// 在文件顶部增加 import：
import templateRoutes from './routes/templateRoutes.js'
import scoreRoutes from './routes/scoreRoutes.js'

// 在路由注册区域增加：
app.use('/api/debate/templates', templateRoutes)
app.use('/api/debate', scoreRoutes)
```

---

### 阶段三：前端组件

#### Task 13: 创建 `api/template.js`

**Files:**
- Create: `frontend/src/api/template.js`

- [x] **Step 1: 写入 API 层**

```javascript
import request from './request'

export const getTemplates = () => {
  return request.get('/debate/templates')
}

export const getTemplateDetail = (id) => {
  return request.get(`/debate/templates/${id}`)
}
```

#### Task 14: 创建 `api/round.js`

**Files:**
- Create: `frontend/src/api/round.js`

- [x] **Step 1: 写入 API 层**

```javascript
import request from './request'

export const getCurrentRound = (topicId) => {
  return request.get(`/debate/topics/${topicId}/current-round`)
}

export const getRounds = (topicId) => {
  return request.get(`/debate/topics/${topicId}/rounds`)
}

export const submitRound = (topicId, roundId, content) => {
  return request.post(`/debate/topics/${topicId}/rounds/${roundId}/submit`, { content })
}

export const skipRound = (topicId, roundId) => {
  return request.post(`/debate/topics/${topicId}/rounds/${roundId}/skip`)
}
```

#### Task 15: 创建 `api/score.js`

**Files:**
- Create: `frontend/src/api/score.js`

- [x] **Step 1: 写入 API 层**

```javascript
import request from './request'

export const submitScore = (topicId, scores) => {
  return request.post(`/debate/topics/${topicId}/score`, { scores })
}

export const getScoreResult = (topicId) => {
  return request.get(`/debate/topics/${topicId}/score-result`)
}
```

#### Task 16: 创建 `DebateTemplateSelector.vue`

**Files:**
- Create: `frontend/src/components/DebateTemplateSelector.vue`

- [x] **Step 1: 写入组件**

```vue
<template>
  <div class="template-selector">
    <label>辩论模式</label>
    <div class="template-list">
      <div
        class="template-card"
        :class="{ selected: modelValue === null }"
        @click="$emit('update:modelValue', null)"
      >
        <div class="card-title">自由辩论</div>
        <div class="card-desc">不设固定轮次，自由发言</div>
      </div>

      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="template-card"
        :class="{ selected: modelValue === tpl.id }"
        @click="handleSelect(tpl)"
      >
        <div class="card-title">{{ tpl.name }}</div>
        <div class="card-desc">{{ tpl.description }}</div>
        <div
          v-if="modelValue === tpl.id"
          class="card-preview"
        >
          <div class="preview-title">轮次预览（共 {{ getRoundCount(tpl) }} 轮）</div>
          <div
            v-for="r in getRoundsPreview(tpl)"
            :key="r.order"
            class="preview-round"
          >
            <span class="round-order">{{ r.order }}.</span>
            <span :class="['round-side', r.speaker === 'pro' ? 'pro' : 'con']">
              {{ r.speaker === 'pro' ? '正方' : '反方' }}
            </span>
            <span class="round-name">{{ r.name }}</span>
            <span class="round-time">{{ formatDuration(r.durationSec) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getTemplates } from '@/api/template'

defineProps({
  modelValue: { type: Number, default: null }
})
const emit = defineEmits(['update:modelValue'])

const templates = ref([])

onMounted(async () => {
  try {
    const res = await getTemplates()
    if (res.code === 200) {
      templates.value = res.data || []
    }
  } catch (_) {
    // 静默失败
  }
})

const handleSelect = (tpl) => {
  emit('update:modelValue', tpl.id)
}

const getRoundCount = (tpl) => {
  const config = typeof tpl.config === 'string' ? JSON.parse(tpl.config) : tpl.config
  return config?.rounds?.length || 0
}

const getRoundsPreview = (tpl) => {
  const config = typeof tpl.config === 'string' ? JSON.parse(tpl.config) : tpl.config
  return config?.rounds || []
}

const formatDuration = (sec) => {
  if (sec >= 60) return `${Math.floor(sec / 60)}分`
  return `${sec}秒`
}
</script>

<style scoped>
.template-selector {
  margin-bottom: 20px;
}

.template-selector > label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: 14px;
}

.template-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.template-card {
  flex: 1;
  min-width: 200px;
  padding: 16px;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: var(--color-primary);
}

.template-card.selected {
  border-color: var(--color-primary);
  background: rgba(74, 144, 226, 0.05);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.card-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.card-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.preview-title {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.preview-round {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 3px 0;
}

.round-order {
  color: var(--color-text-tertiary);
  min-width: 16px;
}

.round-side {
  font-weight: 600;
  min-width: 28px;
}

.round-side.pro { color: var(--color-primary); }
.round-side.con { color: var(--color-danger); }

.round-name {
  color: var(--color-text);
  flex: 1;
}

.round-time {
  color: var(--color-text-tertiary);
  font-size: 11px;
}
</style>
```

#### Task 17: 创建 `DebateRoundTimer.vue`

**Files:**
- Create: `frontend/src/components/DebateRoundTimer.vue`
- Test: `frontend/src/__tests__/DebateRoundTimer.test.js`

- [x] **Step 1: 写入组件**

```vue
<template>
  <div class="round-timer">
    <div class="timer-header">
      <div class="round-info">
        <span class="round-label">第 {{ currentRound.order }}/{{ totalRounds }} 轮</span>
        <span class="round-name">{{ currentRound.roundName }}</span>
      </div>
      <div
        v-if="isMyTurn"
        class="turn-badge my-turn"
      >
        我的回合
      </div>
      <div
        v-else
        class="turn-badge opponent-turn"
      >
        对方回合
      </div>
    </div>

    <div class="timer-body">
      <div class="timer-countdown">
        <svg
          :class="['timer-circle', timerClass]"
          viewBox="0 0 60 60"
          width="60"
          height="60"
        >
          <circle
            cx="30"
            cy="30"
            r="26"
            fill="none"
            stroke="var(--color-border)"
            stroke-width="4"
          />
          <circle
            cx="30"
            cy="30"
            r="26"
            fill="none"
            :stroke="circleColor"
            stroke-width="4"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            stroke-linecap="round"
            transform="rotate(-90, 30, 30)"
          />
        </svg>
        <div class="timer-text">
          {{ formatTime(remainingSec) }}
        </div>
      </div>
      <div class="timer-status">
        <div class="current-speaker">
          当前发言：{{ currentRound.speakerName || (currentRound.speakerStance === 1 ? '正方' : '反方') }}
        </div>
      </div>
    </div>

    <div
      v-if="isMyTurn && remainingSec <= 0"
      class="timeout-warning"
    >
      时间到！正在自动跳过...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { skipRound } from '@/api/round'

const props = defineProps({
  currentRound: { type: Object, required: true },
  totalRounds: { type: Number, required: true },
  userId: { type: Number, required: true },
  isMyTurn: { type: Boolean, default: false }
})

const emit = defineEmits(['skipped'])

const remainingSec = ref(props.currentRound.remainingSec)
const circumference = 2 * Math.PI * 26

const dashOffset = computed(() => {
  const ratio = remainingSec.value / props.currentRound.durationSec
  return circumference * (1 - ratio)
})

const timerClass = computed(() => {
  if (remainingSec.value <= 0) return 'timeout'
  if (remainingSec.value <= 30) return 'warning'
  return 'normal'
})

const circleColor = computed(() => {
  if (remainingSec.value <= 0) return 'var(--color-danger)'
  if (remainingSec.value <= 30) return 'var(--color-warning)'
  return 'var(--color-success)'
})

const formatTime = (sec) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

let timerInterval = null

watch(() => props.currentRound.roundId, () => {
  remainingSec.value = props.currentRound.remainingSec
  startTimer()
}, { immediate: true })

const startTimer = () => {
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    remainingSec.value = Math.max(0, remainingSec.value - 1)

    if (remainingSec.value <= 0 && props.isMyTurn) {
      clearInterval(timerInterval)
      handleTimeout()
    }
  }, 1000)
}

const handleTimeout = async () => {
  try {
    await skipRound(props.currentRound.topicId, props.currentRound.roundId)
    emit('skipped')
  } catch (_) {
    // 静默
  }
}

onUnmounted(() => {
  clearInterval(timerInterval)
})
</script>

<style scoped>
.round-timer {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.round-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.round-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.round-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.turn-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.my-turn {
  background: rgba(39, 174, 96, 0.15);
  color: var(--color-success);
}

.opponent-turn {
  background: rgba(153, 153, 153, 0.15);
  color: var(--color-text-secondary);
}

.timer-body {
  display: flex;
  align-items: center;
  gap: 24px;
}

.timer-countdown {
  position: relative;
  flex-shrink: 0;
}

.timer-circle {
  display: block;
}

.timer-circle.normal { filter: none; }

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.timer-status {
  flex: 1;
}

.current-speaker {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.timeout-warning {
  margin-top: 12px;
  padding: 8px 16px;
  background: rgba(226, 75, 74, 0.1);
  color: var(--color-danger);
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
}
</style>
```

- [x] **Step 2: 写入计时器测试**

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DebateRoundTimer from '../components/DebateRoundTimer.vue'

describe('DebateRoundTimer', () => {
  it('renders round info correctly', () => {
    const wrapper = mount(DebateRoundTimer, {
      props: {
        currentRound: {
          roundId: 3,
          roundName: '正方反驳',
          order: 3,
          speakerStance: 1,
          speakerId: 42,
          durationSec: 240,
          remainingSec: 180,
          status: 'active'
        },
        totalRounds: 7,
        userId: 42,
        isMyTurn: true
      }
    })

    expect(wrapper.text()).toContain('第 3/7 轮')
    expect(wrapper.text()).toContain('正方反驳')
    expect(wrapper.text()).toContain('我的回合')
  })

  it('shows opponent turn when not my turn', () => {
    const wrapper = mount(DebateRoundTimer, {
      props: {
        currentRound: {
          roundId: 2,
          roundName: '反方立论',
          order: 2,
          speakerStance: 0,
          speakerId: 43,
          durationSec: 300,
          remainingSec: 250,
          status: 'active'
        },
        totalRounds: 7,
        userId: 42,
        isMyTurn: false
      }
    })

    expect(wrapper.text()).toContain('对方回合')
  })
})
```

#### Task 18: 创建 `DebateScorePanel.vue`

**Files:**
- Create: `frontend/src/components/DebateScorePanel.vue`

- [x] **Step 1: 写入评分面板**

```vue
<template>
  <div class="score-panel">
    <template v-if="scored">
      <h3>辩论结果</h3>
      <div class="result-grid">
        <div
          :class="['result-card', winner === 'pro' ? 'winner' : '']"
        >
          <div class="result-label">正方{{ winner === 'pro' ? ' 🏆' : '' }}</div>
          <div class="result-score">{{ result?.pro?.total || '-' }}</div>
          <div
            v-for="(val, key) in result?.pro?.breakdown"
            :key="key"
            class="result-item"
          >
            <span>{{ key }}</span>
            <span>{{ val }}</span>
          </div>
        </div>
        <div
          :class="['result-card', winner === 'con' ? 'winner' : '']"
        >
          <div class="result-label">反方{{ winner === 'con' ? ' 🏆' : '' }}</div>
          <div class="result-score">{{ result?.con?.total || '-' }}</div>
          <div
            v-for="(val, key) in result?.con?.breakdown"
            :key="key"
            class="result-item"
          >
            <span>{{ key }}</span>
            <span>{{ val }}</span>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <h3>辩论评分</h3>
      <p class="score-hint">请为正反双方按以下标准评分（1-10 分）</p>

      <div class="stance-section">
        <h4>正方评分</h4>
        <div
          v-for="(c, idx) in criteria"
          :key="c.key"
          class="score-row"
        >
          <div class="score-label">
            <span class="criterion-name">{{ c.name }}</span>
            <span class="criterion-desc">{{ c.description }}</span>
          </div>
          <el-slider
            v-model="proScores[idx]"
            :min="1"
            :max="10"
            :step="1"
            show-stops
            :marks="{ 1: '1', 5: '5', 10: '10' }"
            style="width: 200px"
          />
          <span class="score-value">{{ proScores[idx] }}</span>
        </div>
      </div>

      <div class="stance-section">
        <h4>反方评分</h4>
        <div
          v-for="(c, idx) in criteria"
          :key="c.key"
          class="score-row"
        >
          <div class="score-label">
            <span class="criterion-name">{{ c.name }}</span>
            <span class="criterion-desc">{{ c.description }}</span>
          </div>
          <el-slider
            v-model="conScores[idx]"
            :min="1"
            :max="10"
            :step="1"
            show-stops
            :marks="{ 1: '1', 5: '5', 10: '10' }"
            style="width: 200px"
          />
          <span class="score-value">{{ conScores[idx] }}</span>
        </div>
      </div>

      <div class="score-actions">
        <button
          :disabled="submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '提交中...' : '提交评分' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { submitScore } from '@/api/score'

const props = defineProps({
  topicId: { type: Number, required: true },
  criteria: { type: Array, default: () => [] },
  result: { type: Object, default: null },
  scored: { type: Boolean, default: false },
  winner: { type: String, default: null }
})

const emit = defineEmits(['submitted'])

const proScores = reactive(props.criteria.map(() => 7))
const conScores = reactive(props.criteria.map(() => 7))
const submitting = ref(false)

const handleSubmit = async () => {
  const scores = []

  props.criteria.forEach((c, idx) => {
    scores.push({ targetStance: 1, criterionKey: c.key, score: proScores[idx] })
    scores.push({ targetStance: 0, criterionKey: c.key, score: conScores[idx] })
  })

  submitting.value = true
  try {
    const res = await submitScore(props.topicId, scores)
    if (res.code === 200) {
      ElMessage.success('评分已提交')
      emit('submitted')
    }
  } catch (_) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.score-panel {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
}

h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: var(--color-text);
}

.score-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

.stance-section {
  margin-bottom: 24px;
}

.stance-section h4 {
  font-size: 15px;
  margin: 0 0 16px;
  color: var(--color-text);
}

.score-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.score-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.criterion-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.criterion-desc {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.score-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  min-width: 24px;
  text-align: center;
}

.score-actions {
  text-align: right;
}

.score-actions button {
  padding: 10px 30px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.score-actions button:disabled {
  opacity: 0.6;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.result-card {
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.result-card.winner {
  border-color: var(--color-success);
  background: rgba(39, 174, 96, 0.05);
}

.result-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.result-score {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 12px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-secondary);
  padding: 4px 0;
}
</style>
```

#### Task 19: 改造 `DebateCreate.vue`

**Files:**
- Modify: `frontend/src/views/DebateCreate.vue`

- [x] **Step 1: 插入模板选择器**

在 `form-item` (分类) 和 `form-row` (人数) 之间插入模板选择器：

```vue
<!-- 在分类选择之后，form-row 之前插入 -->
<div class="form-item">
  <DebateTemplateSelector v-model="form.templateId" />
</div>
```

Script 部分增加：

```javascript
// 在 import 区域增加
import DebateTemplateSelector from '@/components/DebateTemplateSelector.vue'

// form 增加 templateId 字段
const form = reactive({
  title: '',
  description: '',
  category: '',
  pro_limit: 5,
  con_limit: 5,
  templateId: null
})
```

注意：选了模板后，`pro_limit` 和 `con_limit` 会被后端自动设为 1，前端可以加个提示或禁用。

在 `handleSubmit` 的 `createDebate` 调用中，`form` 已经包含 `templateId`，不需要额外处理。

#### Task 20: 改造 `DebateFlow.vue`

**Files:**
- Modify: `frontend/src/views/DebateFlow.vue`

- [x] **Step 1: 集成轮次系统**

在模板中，步骤 2 区域增加轮次计时器：

```vue
<template>
  <div class="debate-flow">
    <h2>辩论流程</h2>

    <!-- 轮次计时器（模板辩论时显示） -->
    <debate-round-timer
      v-if="isTemplateDebate && currentRound && currentRound.status === 'active'"
      :current-round="currentRound"
      :total-rounds="totalRounds"
      :user-id="userId"
      :is-my-turn="isMyTurn"
      @skipped="loadCurrentRound"
    />

    <!-- 原有步骤1: 选择立场 -->
    <div v-if="step === 1" class="step">
      ...
    </div>

    <!-- 改造后的步骤2: 发言 -->
    <div v-if="step === 2" class="step">
      <div v-if="isTemplateDebate">
        <!-- 模板辩论：只允许在当前轮次发言 -->
        <div v-if="isMyTurn && currentRound?.status === 'active'" class="round-speech-input">
          <div class="round-speech-header">
            当前轮次：{{ currentRound.roundName }}
            <span class="remaining-time">剩余 {{ formatTime(currentRound.remainingSec) }}</span>
          </div>
          <textarea
            v-model="speechContent"
            placeholder="请输入你的发言..."
            maxlength="1000"
            rows="6"
          />
          <div class="speech-actions">
            <button :disabled="!speechContent.trim()" @click="submitRoundSpeech">
              提交发言
            </button>
          </div>
        </div>
        <div v-else-if="currentRound?.status === 'active'" class="waiting-hint">
          等待对方发言...
        </div>
        <div v-else class="round-complete">
          辩论轮次已全部完成，请查看结果
        </div>
      </div>
      <div v-else>
        <!-- 自由辩论：保持原有 SpeechInput 组件 -->
        <SpeechInput :topic-id="mockTopic.id" @submitted="handleSpeechSubmitted" />
      </div>
    </div>

    <!-- 赛程进度（模板辩论时显示） -->
    <div v-if="isTemplateDebate && rounds.length" class="round-progress">
      <div class="progress-title">辩论赛程</div>
      <div class="progress-steps">
        <div
          v-for="r in rounds"
          :key="r.id"
          :class="['progress-step', getRoundStatusClass(r)]"
        >
          <div class="step-dot" />
          <div class="step-label">{{ r.round_name }}</div>
          <div class="step-speaker">{{ r.speaker_stance === 1 ? '正' : '反' }}</div>
        </div>
      </div>
    </div>

    <!-- 原有步骤3: 发言列表展示 -->
    <div v-if="step >= 2" class="step">
      ...
    </div>

    <!-- 评分面板（辩论结束后） -->
    <debate-score-panel
      v-if="showScorePanel"
      :topic-id="mockTopic.id"
      :criteria="scoreCriteria"
      :result="scoreResult"
      :scored="hasScored"
      :winner="scoreWinner"
      @submitted="handleScoreSubmitted"
    />
  </div>
</template>
```

Script 改造部分：

```javascript
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import DebateRoundTimer from '@/components/DebateRoundTimer.vue'
import DebateScorePanel from '@/components/DebateScorePanel.vue'
import { getCurrentRound, getRounds, submitRound as submitRoundSpeech } from '@/api/round'
import { getScoreResult } from '@/api/score'

const route = useRoute()
const userId = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr).id : null
})

// 模板辩论相关状态
const isTemplateDebate = ref(false)
const currentRound = ref(null)
const rounds = ref([])
const totalRounds = ref(0)
const speechContent = ref('')
const userStance = ref(0)

// 评分相关
const showScorePanel = ref(false)
const scoreResult = ref(null)
const scoreCriteria = ref([])
const scoreWinner = ref(null)
const hasScored = ref(false)

const isMyTurn = computed(() => {
  if (!currentRound.value) return false
  return currentRound.value.speakerId === userId.value
})

// 初始化后检查是否是模板辩论
const checkTemplateDebate = async () => {
  const roundData = await getCurrentRound(mockTopic.id)
  if (roundData?.data?.templateId || rounds.value.length > 0) {
    isTemplateDebate.value = true
    currentRound.value = roundData?.data
    await loadRounds()
  }
}

const loadCurrentRound = async () => {
  try {
    const res = await getCurrentRound(mockTopic.id)
    if (res.code === 200) {
      if (res.data?.debateComplete) {
        currentRound.value = null
        showScorePanel.value = true
        await loadScoreResult()
      } else {
        currentRound.value = res.data
      }
    }
  } catch (_) {}
}

const loadRounds = async () => {
  try {
    const res = await getRounds(mockTopic.id)
    if (res.code === 200) {
      rounds.value = res.data || []
      totalRounds.value = rounds.value.length
    }
  } catch (_) {}
}

const submitRoundSpeech = async () => {
  if (!speechContent.value.trim()) return
  try {
    const res = await submitRoundSpeech(mockTopic.id, currentRound.value.roundId, speechContent.value)
    if (res.code === 200) {
      speechContent.value = ''
      if (res.data?.debateComplete) {
        currentRound.value = null
        showScorePanel.value = true
        await loadScoreResult()
      } else if (res.data?.freeDebate) {
        await loadCurrentRound()
      } else if (res.data?.nextRound) {
        await loadCurrentRound()
      }
      await loadRounds()
    }
  } catch (_) {}
}

const getRoundStatusClass = (r) => {
  if (r.status === 'active') return 'active'
  if (r.status === 'completed' || r.status === 'timeout' || r.status === 'skipped') return 'done'
  return 'pending'
}

const loadScoreResult = async () => {
  try {
    const res = await getScoreResult(mockTopic.id)
    if (res.code === 200) {
      scoreResult.value = res.data?.scores
      scoreCriteria.value = res.data?.criteria || []
      scoreWinner.value = res.data?.winner
      hasScored.value = res.data?.scores?.pro?.voterCount > 0
    }
  } catch (_) {}
}

const formatTime = (sec) => {
  const m = Math.floor((sec || 0) / 60)
  const s = (sec || 0) % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

watch(() => mockTopic.status, (val) => {
  if (val === 2) { // CLOSED
    showScorePanel.value = true
    loadScoreResult()
  }
})

// 在 handleJoined 中增加模板检测
const handleJoined = async (stance) => {
  userStance.value = stance
  step.value = 2
  await checkTemplateDebate()
}
```

---

### 阶段四：测试 + 验收

测试已在每个 Task 的 Step 中包含。执行顺序：

1. 后端：`npm test` (backend)
2. 前端：`npx vitest run` (frontend)
3. Lint: `npm run lint` (both)

