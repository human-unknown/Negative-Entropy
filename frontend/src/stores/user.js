import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 用户 Store — 统一管理认证状态、用户信息、权限等级
 * 替代分散在各组件中的 localStorage 直接读写
 */
export const useUserStore = defineStore('user', () => {
  // ---- state ----
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(parseStoredUser())

  // ---- getters ----
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const userId = computed(() => user.value?.id ?? null)
  const userName = computed(() => user.value?.name ?? '')
  const userLevel = computed(() => user.value?.level ?? 0)
  const isAdmin = computed(() => user.value?.level === 4)

  // ---- actions ----
  function login(newToken, newUser) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function updateUser(partial) {
    user.value = { ...user.value, ...partial }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  /** 刷新用户信息（用于个人资料页更新后同步） */
  function refreshFromStorage() {
    user.value = parseStoredUser()
  }

  return {
    token,
    user,
    isLoggedIn,
    userId,
    userName,
    userLevel,
    isAdmin,
    login,
    logout,
    updateUser,
    refreshFromStorage,
  }
})

function parseStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
