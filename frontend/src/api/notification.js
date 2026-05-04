import request from './request'

/**
 * 获取通知列表
 * @param {Object} params - { page, limit, unreadOnly }
 */
export const getNotifications = (params) => {
  return request.get('/notification', { params })
}

/**
 * 获取未读通知数量
 */
export const getUnreadCount = () => {
  return request.get('/notification/unread-count')
}

/**
 * 标记单条通知为已读
 * @param {number} id - 通知ID
 */
export const markAsRead = (id) => {
  return request.put(`/notification/${id}/read`)
}

/**
 * 标记全部为已读
 */
export const markAllAsRead = () => {
  return request.put('/notification/read-all')
}

export default { getNotifications, getUnreadCount, markAsRead, markAllAsRead }
