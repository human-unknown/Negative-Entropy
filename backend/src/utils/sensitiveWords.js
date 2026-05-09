/**
 * 可配置敏感词库
 *
 * 分为两级：
 *   blocked   → 直接拒绝（硬违规词）
 *   suspicious → 疑似敏感，需 AI 二次判断
 *
 * 支持从数据库刷新（管理后台可配置）
 */

// ─── 内置默认词库 ────────────────────────────────

const DEFAULT_BLOCKED = [
  // 这些是示例，实际运行时从数据库加载
]

const DEFAULT_SUSPICIOUS = [
  // 疑似敏感词，结合 AI 判断
]

// ─── 运行时缓存 ───────────────────────────────────

let blockedWords = [...DEFAULT_BLOCKED]
let suspiciousWords = [...DEFAULT_SUSPICIOUS]

// ─── 公开 API ─────────────────────────────────────

/**
 * 检查内容是否包含敏感词
 * @param {string} content
 * @returns {{ blocked: boolean, suspicious: boolean, reason?: string }}
 */
export function sensitiveWordCheck(content) {
  if (!content) return { blocked: false, suspicious: false }
  const lower = content.toLowerCase()

  for (const word of blockedWords) {
    if (lower.includes(word.toLowerCase())) {
      return { blocked: true, suspicious: false, reason: '内容包含违规信息' }
    }
  }

  for (const word of suspiciousWords) {
    if (lower.includes(word.toLowerCase())) {
      return { blocked: false, suspicious: true }
    }
  }

  return { blocked: false, suspicious: false }
}

/**
 * 从数据库刷新敏感词缓存
 * @param {import('mysql2/promise').Pool} pool
 */
export async function refreshSensitiveWords(pool) {
  try {
    const [blocked] = await pool.query(
      "SELECT word FROM sensitive_words WHERE level = 'blocked' AND is_active = 1"
    )
    const [suspicious] = await pool.query(
      "SELECT word FROM sensitive_words WHERE level = 'suspicious' AND is_active = 1"
    )
    blockedWords = blocked.map(r => r.word)
    suspiciousWords = suspicious.map(r => r.word)
  } catch (err) {
    console.error('[敏感词库] 刷新缓存失败:', err.message)
  }
}

/**
 * 获取当前所有敏感词（调试/管理用）
 */
export function getSensitiveWords() {
  return { blocked: [...blockedWords], suspicious: [...suspiciousWords] }
}
