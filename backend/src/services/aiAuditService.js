import OpenAI from 'openai'
import crypto from 'crypto'
import { sensitiveWordCheck } from '../utils/sensitiveWords.js'

/**
 * AI审核结果枚举
 */
export const AuditResult = {
  PASS: 'pass',
  REJECT: 'reject',
  MANUAL_REVIEW: 'manual_review',
}

/**
 * AI审核服务 — 基于 DeepSeek API 的语义审核
 *
 * 三层过滤架构：
 *   第一层 → 规则引擎（快速拒绝明确违规）
 *   第二层 → AI 语义审核（LLM 判断）
 *   第三层 → 降级兜底（AI 不可用时使用规则引擎）
 */
class AIAuditService {
  constructor() {
    this.client = null
    this.enabled = false
    this.model = 'deepseek-chat'
  }

  /**
   * 延迟初始化 —— 仅在配置启用时创建连接
   */
  init() {
    const enabled = process.env.AI_AUDIT_ENABLED === 'true'
    if (!enabled) {
      console.log('[AI审核] 未启用（AI_AUDIT_ENABLED != true），使用规则引擎模式')
      return
    }

    const apiKey = process.env.AI_AUDIT_API_KEY
    if (!apiKey) {
      console.warn('[AI审核] API Key 未配置，降级为规则引擎模式')
      return
    }

    this.enabled = true
    this.model = process.env.AI_AUDIT_MODEL || 'deepseek-chat'
    this.client = new OpenAI({
      apiKey,
      baseURL: process.env.AI_AUDIT_BASE_URL || 'https://api.deepseek.com',
      timeout: parseInt(process.env.AI_AUDIT_TIMEOUT_MS) || 8000,
      maxRetries: parseInt(process.env.AI_AUDIT_MAX_RETRIES) || 2,
    })
    console.log(`[AI审核] 已启用，模型: ${this.model}`)
  }

  /**
   * 审核内容 — 主入口
   * @param {string} content - 待审核内容
   * @param {string} type - 内容类型
   * @returns {Promise<{ result, reason?, confidence?, categories? }>}
   */
  async auditContent(content, type) {
    // 第一层：规则引擎
    const ruleResult = this._checkBasicRules(content, type)
    if (ruleResult) {
      return ruleResult
    }

    // 第二层：AI 语义审核
    if (this.enabled && this.client) {
      try {
        return await this._aiAudit(content, type)
      } catch (err) {
        console.error('[AI审核] 调用失败，降级:', err.message)
        return this._fallbackCheck(content)
      }
    }

    // AI 未启用：仅规则引擎
    return this._fallbackCheck(content)
  }

  // ─── 第一层：规则引擎 ───────────────────────────────

  _checkBasicRules(content, type) {
    if (!content || content.trim().length === 0) {
      return { result: AuditResult.REJECT, reason: '内容不能为空', confidence: 0.99 }
    }

    const maxLengths = {
      username: 20, topic: 200, speech: 1000,
      post_title: 200, post_content: 10000, comment: 2000,
    }

    const max = maxLengths[type] || 2000
    if (content.length > max) {
      return { result: AuditResult.REJECT, reason: `内容超过长度限制(${max}字符)`, confidence: 0.99 }
    }

    // 用户名特殊规则
    if (type === 'username') {
      if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(content)) {
        return { result: AuditResult.REJECT, reason: '用户名含非法字符', confidence: 0.99 }
      }
      if (content.length < 2) {
        return { result: AuditResult.REJECT, reason: '用户名过短', confidence: 0.99 }
      }
    }

    // 敏感词库检查
    const wordCheck = sensitiveWordCheck(content)
    if (wordCheck.blocked) {
      return { result: AuditResult.REJECT, reason: wordCheck.reason, confidence: 0.99 }
    }

    return null // 规则层面通过
  }

  // ─── 第二层：AI 语义审核 ─────────────────────────────

  async _aiAudit(content, type) {
    const startTime = Date.now()
    const prompt = this._buildAuditPrompt(content, type)

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    const elapsed = Date.now() - startTime
    const raw = response.choices[0].message.content
    let parsed

    try {
      parsed = JSON.parse(raw)
    } catch {
      // AI 返回非 JSON 时，按疑似处理
      console.warn('[AI审核] 返回非JSON:', raw.substring(0, 100))
      parsed = { verdict: 'manual_review', reason: 'AI返回格式异常', confidence: 0.5, categories: [] }
    }

    // 归一化 verdict
    const verdictMap = { pass: AuditResult.PASS, reject: AuditResult.REJECT, manual_review: AuditResult.MANUAL_REVIEW }
    const verdictRaw = (parsed.verdict || '').toLowerCase()
    const verdict = verdictMap[verdictRaw] || AuditResult.MANUAL_REVIEW

    const result = {
      result: verdict,
      reason: parsed.reason || null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
    }

    // 异步记录日志
    this._log(result, content, type, elapsed, response.usage).catch(() => {})

    return result
  }

  _buildAuditPrompt(content, type) {
    const labels = {
      topic: '辩论话题的标题或描述',
      speech: '辩论发言',
      username: '用户昵称',
      post_title: '帖子标题',
      post_content: '帖子正文',
      comment: '评论回复',
    }
    const label = labels[type] || '内容'
    return `请审核以下${label}：\n\n"""\n${content}\n"""\n\n请根据系统提示中的审核标准，输出JSON格式的审核结果。`
  }

  // ─── 第三层：降级兜底 ───────────────────────────────

  _fallbackCheck(content) {
    const wordCheck = sensitiveWordCheck(content)
    if (wordCheck.blocked) {
      return { result: AuditResult.REJECT, reason: wordCheck.reason, confidence: 0.95 }
    }
    if (wordCheck.suspicious) {
      return { result: AuditResult.MANUAL_REVIEW, reason: '内容疑似包含敏感信息', confidence: 0.6 }
    }
    return { result: AuditResult.PASS, confidence: 0.7 }
  }

  // ─── 日志记录 ─────────────────────────────────────

  async _log(result, content, type, elapsed, usage) {
    try {
      const pool = (await import('../config/database.js')).default
      const hash = crypto.createHash('md5').update(content).digest('hex')
      await pool.query(
        `INSERT INTO ai_audit_log (content_hash, content_type, verdict, reason, confidence,
         categories, model, elapsed_ms, prompt_tokens, completion_tokens, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          hash, type, result.result, result.reason || null,
          result.confidence, JSON.stringify(result.categories || []),
          this.model, elapsed,
          usage?.prompt_tokens || 0, usage?.completion_tokens || 0,
        ]
      )
    } catch (err) {
      console.error('[AI审核] 日志写入失败:', err.message)
    }
  }
}

// ─── 系统提示词 ─────────────────────────────────────

const SYSTEM_PROMPT = `你是一个专业的内容审核系统，服务于一个以"逻辑严谨"为核心价值观的中文严肃讨论社区。

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

// 单例导出
export const aiAuditService = new AIAuditService()
