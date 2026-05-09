# AI审核实现方案

> 基于项目当前状态 | 2026-05-09
>
> 决策：DeepSeek API | 同步阻塞 | AI为主+规则兜底 | 需要管理界面

---

## 一、现状诊断

### 已有的

| 组件 | 文件 | 状态 |
|------|------|------|
| AI审核服务类 | `backend/src/middlewares/aiAudit.js` | ✅ 框架完整，逻辑是模拟的 |
| 审核路由 | `backend/src/routes/auditRoutes.js` | ✅ `/api/audit/precheck` 已挂载 |
| 人工复核队列 | `backend/src/controllers/reviewController.js` | ✅ content_review_queue 表 + 4个端点 |
| 违规自动处罚 | `backend/src/utils/violation.js` | ✅ autoEscalateViolation |
| 审核状态追踪 | debate_topic / debate_speech / post / comment | ✅ 都有 audit_status 字段 |
| 公告配置 | `.env.production` | ⚠️ 有 AI_API_KEY 占位，未使用 |

### 缺失的

| 缺失项 | 说明 |
|--------|------|
| 🔴 真实AI模型调用 | 当前 calculateSensitiveScore() 是正则启发式 |
| 🔴 LLM Prompt 设计 | 无审核专用提示词 |
| 🔴 API Key 管理 | .env 中的 API_KEY 未读取 |
| 🟡 审核日志追踪 | 无 AI 调用耗时、Token 用量、错误率统计 |
| 🟡 管理配置界面 | 无审核阈值调节、敏感词库可视化管理 |
| 🟡 降级策略 | AI 不可用时的回退方案 |

---

## 二、总实施顺序

```
Phase 0: P0 安全修复（上线前提条件）
  ├── rate-limit + helmet + CORS
  ├── 密码外部化 + Redis
  └── 用时：1-2天

Phase 1: AI审核核心（本项目）
  ├── DeepSeek API 集成
  ├── 审核 Prompt 设计
  ├── 降级与容错
  └── 用时：1-2天

Phase 2: AI审核管理界面
  ├── 审核配置页
  ├── 审核日志与统计
  └── 用时：1天

Phase 3: 产品改造（后续独立推进）
  ├── Sprint 1-4：帖子/评论/频道系统
  └── AI审核覆盖扩展到所有新内容类型
```

---

## 三、Phase 1：AI审核核心实现

### 3.1 依赖安装

```bash
cd backend
npm install openai  # DeepSeek 兼容 OpenAI SDK
```

### 3.2 环境变量

```env
# .env.development / .env.production
AI_AUDIT_ENABLED=true
AI_AUDIT_PROVIDER=deepseek
AI_AUDIT_API_KEY=sk-xxxxxxxxxxxxxxxx
AI_AUDIT_BASE_URL=https://api.deepseek.com
AI_AUDIT_MODEL=deepseek-chat
AI_AUDIT_TIMEOUT_MS=8000
AI_AUDIT_MAX_RETRIES=2
```

### 3.3 新文件结构

```
backend/src/
├── services/
│   └── aiAuditService.js      # 🆕 真实AI审核服务（替换模拟逻辑）
├── middlewares/
│   └── aiAudit.js              # 🔄 改造：使用新 service，保持接口不变
├── utils/
│   └── sensitiveWords.js       # 🆕 敏感词库（可配置）
```

### 3.4 核心服务设计

#### `services/aiAuditService.js`

```js
import OpenAI from 'openai'
import { sensitiveWordCheck } from '../utils/sensitiveWords.js'

class AIAuditService {
  constructor() {
    this.client = null
    this.enabled = false
  }

  /**
   * 初始化AI客户端（延迟初始化，仅在启用时创建连接）
   */
  init() {
    const enabled = process.env.AI_AUDIT_ENABLED === 'true'
    if (!enabled) return

    this.enabled = true
    this.client = new OpenAI({
      apiKey: process.env.AI_AUDIT_API_KEY,
      baseURL: process.env.AI_AUDIT_BASE_URL || 'https://api.deepseek.com',
      timeout: parseInt(process.env.AI_AUDIT_TIMEOUT_MS) || 8000,
      maxRetries: parseInt(process.env.AI_AUDIT_MAX_RETRIES) || 2,
    })
  }

  /**
   * 审核内容 - 主入口
   * @param {string} content - 待审核内容
   * @param {string} type - 内容类型
   * @returns {Promise<{result, reason, confidence}>}
   */
  async auditContent(content, type) {
    // 第一层：规则引擎（快速拒绝明确违规）
    const ruleResult = this.checkBasicRules(content, type)
    if (ruleResult) {
      return ruleResult  // { result: 'reject', reason: '...', confidence: 0.99 }
    }

    // 第二层：AI语义审核
    if (this.enabled && this.client) {
      try {
        return await this.aiAudit(content, type)
      } catch (err) {
        console.error('AI审核调用失败，降级为规则引擎:', err.message)
        // 降级：AI不可用时，用敏感词库做第二次规则检查
        return this.fallbackCheck(content)
      }
    }

    // AI未启用：仅规则引擎
    return this.fallbackCheck(content)
  }

  /**
   * AI 语义审核（调用 DeepSeek）
   */
  async aiAudit(content, type) {
    const startTime = Date.now()
    
    const prompt = this.buildAuditPrompt(content, type)

    const response = await this.client.chat.completions.create({
      model: process.env.AI_AUDIT_MODEL || 'deepseek-chat',
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,       // 低温度保证一致性
      max_tokens: 300,         // 审核结果不需要长回复
      response_format: { type: 'json_object' },
    })

    const elapsed = Date.now() - startTime
    const result = JSON.parse(response.choices[0].message.content)

    // 记录审核日志（异步，不阻塞返回）
    this.logAuditCall({ content, type, result, elapsed, tokens: response.usage })

    return {
      result: result.verdict,        // 'pass' | 'manual_review' | 'reject'
      reason: result.reason || null,
      confidence: result.confidence || 0.5,
      categories: result.categories || [],
    }
  }

  /**
   * 构建审核系统提示词
   */
  getSystemPrompt() {
    return `你是一个专业的内容审核系统，服务于一个以"逻辑严谨"为核心价值观的中文严肃讨论社区。

你需要审核的内容类型包括：帖子标题、帖子正文、评论回复、辩论发言。

审核标准（按严重程度排序）：
1. 【直接违规】人身攻击、辱骂、仇恨言论、色情内容 → verdict: "reject"
2. 【间接违规】广告推广、恶意灌水、无意义重复 → verdict: "reject"
3. 【疑似违规】含有联系方式诱导、争议性内容但未明确违规 → verdict: "manual_review"
4. 【正常内容】逻辑清晰的讨论、有理有据的观点表达 → verdict: "pass"

注意：
- 观点分歧本身不是违规，批评观点和批评人是两回事
- 引述他人言论用于反驳不算违规，但断章取义恶意曲解需要标记
- 学术性讨论中的敏感词（如讨论政治哲学）需要结合语境判断

你的输出必须是严格的JSON格式：
{
  "verdict": "pass" | "manual_review" | "reject",
  "reason": "简短的原因说明（20字以内）",
  "confidence": 0.0-1.0,
  "categories": ["违规类别列表，如：人身攻击、广告、色情、灌水等"]
}`
  }

  /**
   * 构建审核提示词（根据内容类型定制）
   */
  buildAuditPrompt(content, type) {
    const typeDescriptions = {
      topic: '这是一个辩论话题的标题或描述',
      speech: '这是一段辩论发言',
      username: '这是一个用户昵称',
      post_title: '这是一个帖子标题',
      post_content: '这是一个帖子正文',
      comment: '这是一条评论回复',
    }

    return `请审核以下${typeDescriptions[type] || '内容'}：

"""
${content}
"""

请根据系统提示中的审核标准，输出JSON格式的审核结果。`
  }

  /**
   * 基础规则检查（第一层，快速拒绝）
   * 保留原有逻辑并扩展
   */
  checkBasicRules(content, type) {
    if (!content || content.trim().length === 0) {
      return { result: 'reject', reason: '内容不能为空', confidence: 0.99 }
    }

    const maxLengths = {
      username: 20, topic: 200, speech: 1000,
      post_title: 200, post_content: 10000, comment: 2000,
    }

    if (content.length > (maxLengths[type] || 2000)) {
      return { result: 'reject', reason: `内容超过长度限制`, confidence: 0.99 }
    }

    // 用户名特殊规则
    if (type === 'username') {
      if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(content)) {
        return { result: 'reject', reason: '用户名含非法字符', confidence: 0.99 }
      }
      if (content.length < 2) {
        return { result: 'reject', reason: '用户名过短', confidence: 0.99 }
      }
    }

    // 敏感词库检查
    const wordCheck = sensitiveWordCheck(content)
    if (wordCheck.blocked) {
      return { result: 'reject', reason: wordCheck.reason, confidence: 0.99 }
    }

    return null  // 规则层面通过，进入AI审核
  }

  /**
   * AI不可用时的降级方案
   */
  fallbackCheck(content) {
    const wordCheck = sensitiveWordCheck(content)
    if (wordCheck.blocked) {
      return { result: 'reject', reason: wordCheck.reason, confidence: 0.95 }
    }
    if (wordCheck.suspicious) {
      return { result: 'manual_review', reason: '内容疑似包含敏感信息', confidence: 0.6 }
    }
    return { result: 'pass', confidence: 0.7 }
  }

  /**
   * 记录审核调用日志（异步写入，不阻塞返回）
   */
  async logAuditCall({ content, type, result, elapsed, tokens }) {
    try {
      const pool = (await import('../config/database.js')).default
      await pool.query(
        `INSERT INTO ai_audit_log (content_hash, content_type, verdict, reason, confidence, 
         categories, model, elapsed_ms, prompt_tokens, completion_tokens, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          this.hashContent(content), type, result.verdict, result.reason || null,
          result.confidence, JSON.stringify(result.categories || []),
          process.env.AI_AUDIT_MODEL, elapsed,
          tokens?.prompt_tokens || 0, tokens?.completion_tokens || 0,
        ]
      )
    } catch (err) {
      console.error('AI审核日志写入失败:', err.message)
    }
  }

  hashContent(content) {
    const crypto = require('crypto')
    return crypto.createHash('md5').update(content).digest('hex')
  }
}

// 单例
export const aiAuditService = new AIAuditService()
```

### 3.5 中间件改造

`middlewares/aiAudit.js` 改造要点：
- 删除 `AIAuditService` 类和 `calculateSensitiveScore()` 方法
- 改为从 `services/aiAuditService.js` 导入
- `aiAudit()` 和 `aiAuditBatch()` 中间件函数**接口保持不变**
- 在 `app.js` 启动时调用 `aiAuditService.init()`

### 3.6 敏感词库

`utils/sensitiveWords.js`：

```js
/**
 * 可配置的敏感词库
 * 分为 "blocked"（直接拒绝）和 "suspicious"（疑似，交AI判断）
 */
const BLOCKED_WORDS = [
  // 从配置文件或数据库加载
]

const SUSPICIOUS_WORDS = [
  // 疑似敏感词，结合AI判断
]

// 支持从数据库加载（管理界面可配置）
let cachedBlockedWords = [...BLOCKED_WORDS]
let cachedSuspiciousWords = [...SUSPICIOUS_WORDS]

/**
 * @returns {{ blocked: boolean, suspicious: boolean, reason?: string }}
 */
export function sensitiveWordCheck(content) {
  const lowerContent = content.toLowerCase()

  for (const word of cachedBlockedWords) {
    if (lowerContent.includes(word.toLowerCase())) {
      return { blocked: true, suspicious: false, reason: `包含违禁词` }
    }
  }

  for (const word of cachedSuspiciousWords) {
    if (lowerContent.includes(word.toLowerCase())) {
      return { blocked: false, suspicious: true }
    }
  }

  return { blocked: false, suspicious: false }
}

/** 从数据库刷新敏感词缓存 */
export async function refreshSensitiveWords(pool) {
  try {
    const [blocked] = await pool.query(
      "SELECT word FROM sensitive_words WHERE level = 'blocked' AND is_active = 1"
    )
    const [suspicious] = await pool.query(
      "SELECT word FROM sensitive_words WHERE level = 'suspicious' AND is_active = 1"
    )
    cachedBlockedWords = blocked.map(r => r.word)
    cachedSuspiciousWords = suspicious.map(r => r.word)
  } catch (err) {
    console.error('刷新敏感词缓存失败:', err.message)
  }
}
```

### 3.7 SQL 迁移

```sql
-- 34_ai_audit_log.sql
CREATE TABLE ai_audit_log (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_hash    VARCHAR(32) NOT NULL COMMENT '内容MD5（去重+隐私保护）',
  content_type    VARCHAR(20) NOT NULL COMMENT 'topic/speech/username/post_title/post_content/comment',
  verdict         VARCHAR(20) NOT NULL COMMENT 'pass/manual_review/reject',
  reason          VARCHAR(200) NULL,
  confidence      DECIMAL(3,2) NOT NULL DEFAULT 0,
  categories      JSON NULL COMMENT '违规类别列表',
  model           VARCHAR(50) NOT NULL COMMENT '使用的AI模型',
  elapsed_ms      INT UNSIGNED NOT NULL DEFAULT 0,
  prompt_tokens   INT UNSIGNED NOT NULL DEFAULT 0,
  completion_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hash (content_hash),
  INDEX idx_verdict (verdict),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 35_sensitive_words.sql
CREATE TABLE sensitive_words (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  word      VARCHAR(100) NOT NULL,
  level     ENUM('blocked', 'suspicious') NOT NULL DEFAULT 'blocked',
  category  VARCHAR(50) NULL COMMENT '类别：色情/暴力/广告/政治/其他',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_word (word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 36_ai_audit_config.sql
CREATE TABLE ai_audit_config (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  config_key  VARCHAR(50) NOT NULL UNIQUE,
  config_value VARCHAR(500) NOT NULL,
  description VARCHAR(200) NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 默认配置
INSERT INTO ai_audit_config (config_key, config_value, description) VALUES
('audit_enabled', 'true', '是否启用AI审核'),
('confidence_threshold_reject', '0.85', '拒绝阈值（confidence >= 此值直接拒绝）'),
('confidence_threshold_manual', '0.60', '人工复核阈值（confidence 在此值到拒绝阈值之间）'),
('max_content_length_topic', '200', '话题最大长度'),
('max_content_length_speech', '1000', '发言最大长度'),
('max_content_length_comment', '2000', '评论最大长度'),
('max_content_length_post', '10000', '帖子最大长度'),
('enable_audit_log', 'true', '是否记录AI审核日志');
```

---

## 四、Phase 2：管理界面

### 4.1 后端 API

在 `adminRoutes.js` 中新增：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/ai/config` | 获取AI审核配置 |
| PUT | `/api/admin/ai/config` | 更新AI审核配置 |
| GET | `/api/admin/ai/stats` | AI审核统计（通过率/拒绝率/耗时） |
| GET | `/api/admin/ai/logs` | AI审核日志列表（分页） |
| GET | `/api/admin/sensitive-words` | 敏感词列表 |
| POST | `/api/admin/sensitive-words` | 添加敏感词 |
| DELETE | `/api/admin/sensitive-words/:id` | 删除敏感词 |
| PUT | `/api/admin/sensitive-words/:id` | 更新敏感词 |

### 4.2 前端管理页面

在 `Admin.vue` 的 "AI模型优化" 标签页中实现：

```
┌──────────────────────────────────────────────┐
│  AI审核配置                                   │
├──────────────────────────────────────────────┤
│  启用AI审核: [开关]                            │
│  拒绝阈值:   [━━━━━●━━━━] 0.85                │
│  人工复核阈值: [━━━━●━━━━━] 0.60              │
│  话题最大长度: [200]                           │
│  发言最大长度: [1000]                          │
│  评论最大长度: [2000]                          │
│  帖子最大长度: [10000]                         │
│  [保存配置]                                    │
├──────────────────────────────────────────────┤
│  AI审核统计（今日）                            │
│  总审核: 1,234 | 通过: 89% | 拒绝: 5% | 复核: 6% │
│  平均耗时: 1.8s | Token用量: 234K              │
├──────────────────────────────────────────────┤
│  敏感词管理                                    │
│  [添加敏感词] [搜索...]                         │
│  ┌──────────────────────────────────────┐    │
│  │ 词        级别    类别    状态   操作   │    │
│  │ ...       ...     ...    ...   ...    │    │
│  └──────────────────────────────────────┘    │
├──────────────────────────────────────────────┤
│  审核日志                                     │
│  [时间范围] [类型] [结果] [搜索...]             │
│  ┌──────────────────────────────────────┐    │
│  │ 时间    类型    结果   置信度  耗时  操作 │    │
│  │ ...     ...    ...    ...    ...   ...  │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

---

## 五、全链路流程

### 用户发布内容时的完整审核流程

```
POST /api/posts { title: "...", content: "..." }
        │
        ▼
┌──────────────────┐
│ aiAuditBatch      │  ← 中间件（自动拦截）
│ [title, content]  │
└──────┬───────────┘
       │
       ▼
┌──────────────────────────────┐
│ aiAuditService.auditContent()│
│                              │
│  第一层: 规则检查 (0ms)       │
│    - 长度/格式/空内容         │
│    - 敏感词库匹配             │
│    ├─ REJECT → 返回 400      │
│    └─ PASS  → 进入第二层      │
│                              │
│  第二层: AI语义审核 (1-3s)    │
│    - DeepSeek API 调用        │
│    - 结构化 Prompt             │
│    ├─ REJECT → 返回 400      │
│    ├─ MANUAL_REVIEW → 继续   │
│    └─ PASS → 继续             │
│                              │
│  第三层: 后处理               │
│    - 记录 ai_audit_log        │
│    - MANUAL_REVIEW: 入 content_review_queue │
│    - REJECT: 自动处罚          │
└──────────────────────────────┘
       │
       ▼
  正常发布 / 入审核队列 / 被拒绝
```

---

## 六、错误处理与降级

| 场景 | 处理策略 |
|------|---------|
| DeepSeek API 超时（>8s） | 降级为敏感词规则引擎，返回 pass/manual_review |
| DeepSeek API 返回错误 | 重试最多2次，仍失败则降级 |
| AI_AUDIT_ENABLED=false | 仅规则引擎，不调用AI |
| 数据库写入失败（日志） | 仅 console.error，不阻塞审核结果返回 |
| API Key 未配置 | 启动时打印警告，降级运行 |
| 网络不可达 | 自动降级，不阻塞用户操作 |

---

## 七、Token 成本估算

以 DeepSeek 定价为例：
- 输入：¥0.001 / 千 token
- 输出：¥0.002 / 千 token

单次审核：
- 系统提示词：~400 tokens
- 用户内容 + 指令：~300 tokens（平均）
- AI回复：~100 tokens
- 单次成本：~0.002 元

日活 1000 人，每人发 3 条内容：3000 次审核/天 = **约 6 元/天 = 180 元/月**

---

## 八、验收标准

- [ ] `POST /api/audit/precheck` 对违规内容返回 `status: "blocked"`
- [ ] `POST /api/audit/precheck` 对正常内容返回 `status: "safe"`
- [ ] 可疑内容进入 `content_review_queue` 表
- [ ] 管理后台可查看/修改审核配置
- [ ] 管理后台可管理敏感词库
- [ ] AI 不可用时自动降级为规则引擎
- [ ] `ai_audit_log` 表正常记录审核日志
- [ ] 单元测试覆盖：规则引擎 / AI调用 / 降级逻辑
- [ ] 单次审核平均耗时 < 3 秒
