import request from './request'

/**
 * 实时预检内容
 * @param {Object} params
 * @param {string} params.content - 待检测内容
 * @param {string} params.type - 内容类型: 'speech' | 'topic' | 'username'
 * @returns {Promise<{status: string, message?: string, violations?: Array}>}
 * status: 'safe' (合规) | 'warning' (提醒) | 'blocked' (禁止提交)
 */
export const preCheckContent = (params) => {
  return request({
    url: '/api/audit/precheck',
    method: 'POST',
    data: params
  })
}

export default {
  preCheckContent
}
