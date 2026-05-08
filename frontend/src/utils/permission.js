import { LEVEL_PERMISSIONS } from '../constants/levelThresholds.js'
import { USER_LEVEL } from '../constants/userLevel.js'
import { useUserStore } from '../stores/user'

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

/** 检查是否为管理员（从 Pinia Store 读取） */
export const checkAdminAccess = () => {
  const userStore = useUserStore()
  return userStore.isAdmin
}
