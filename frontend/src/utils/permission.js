import { LEVEL_PERMISSIONS } from '../constants/levelThresholds.js'
import { USER_LEVEL } from '../constants/userLevel.js'

export const hasPermission = (userLevel, permission) => {
  const permissions = LEVEL_PERMISSIONS[userLevel] || []
  return permissions.includes(permission)
}

export const canCreateDebate = (userLevel) => {
  return hasPermission(userLevel, 'debate_create')
}

export const canReviewContent = (userLevel) => {
  return hasPermission(userLevel, 'content_review')
}

export const canManageUser = (userLevel) => {
  return hasPermission(userLevel, 'user_manage')
}

export const isAdmin = (userLevel) => {
  return userLevel === USER_LEVEL.ADMIN
}

export const checkAdminAccess = () => {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  return user && isAdmin(user.level)
}
