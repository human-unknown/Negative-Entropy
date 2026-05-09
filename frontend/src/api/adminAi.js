import request from './request'

// ═══════════ AI审核配置 ═══════════

export const getAIConfig = () =>
  request.get('/admin/ai/config')

export const updateAIConfig = (data) =>
  request.put('/admin/ai/config', data)

// ═══════════ AI审核统计 ═══════════

export const getAIStats = (params) =>
  request.get('/admin/ai/stats', { params })

// ═══════════ AI审核日志 ═══════════

export const getAILogs = (params) =>
  request.get('/admin/ai/logs', { params })

// ═══════════ 敏感词管理 ═══════════

export const getSensitiveWords = (params) =>
  request.get('/admin/sensitive-words', { params })

export const addSensitiveWord = (data) =>
  request.post('/admin/sensitive-words', data)

export const updateSensitiveWord = (id, data) =>
  request.put(`/admin/sensitive-words/${id}`, data)

export const deleteSensitiveWord = (id) =>
  request.delete ? request.delete(`/admin/sensitive-words/${id}`) :
    request.put(`/admin/sensitive-words/${id}/delete`)

export default {
  getAIConfig, updateAIConfig,
  getAIStats, getAILogs,
  getSensitiveWords, addSensitiveWord, updateSensitiveWord, deleteSensitiveWord,
}
