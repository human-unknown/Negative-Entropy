import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getNotifications } from '@/api/notification'

/**
 * 通知 Store — 管理未读通知数、通知列表缓存
 */
export const useNotificationStore = defineStore('notification', () => {
  // ---- state ----
  const unreadCount = ref(0)
  const notifications = ref([])
  const loading = ref(false)

  // ---- getters ----
  const hasUnread = computed(() => unreadCount.value > 0)

  // ---- actions ----
  async function fetchNotifications(page = 1) {
    loading.value = true
    try {
      const res = await getNotifications({ page, pageSize: 20 })
      if (res.data?.code === 200) {
        notifications.value = res.data.data.list || []
        unreadCount.value = res.data.data.unread || 0
      }
    } catch (err) {
      console.error('获取通知失败:', err)
    } finally {
      loading.value = false
    }
  }

  function setUnreadCount(count) {
    unreadCount.value = count
  }

  function decrementUnread(n = 1) {
    unreadCount.value = Math.max(0, unreadCount.value - n)
  }

  return {
    unreadCount,
    notifications,
    loading,
    hasUnread,
    fetchNotifications,
    setUnreadCount,
    decrementUnread,
  }
})
