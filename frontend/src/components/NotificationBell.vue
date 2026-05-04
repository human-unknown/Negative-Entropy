<template>
  <div ref="bellRef" class="notification-bell">
    <button class="bell-btn" @click="toggleDropdown">
      <svg class="bell-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>

    <Teleport to="body">
      <div v-if="showDropdown" class="bell-dropdown" :style="dropdownStyle">
        <div class="dropdown-header">
          <span class="dropdown-title">通知</span>
          <button v-if="unreadCount > 0" class="mark-all-btn" @click="handleMarkAllRead">全部标记已读</button>
        </div>
        <div class="dropdown-body">
          <div v-if="loading" class="dropdown-loading">加载中...</div>
          <div v-else-if="notifications.length === 0" class="dropdown-empty">暂无通知</div>
          <div
            v-for="item in notifications"
            v-else
            :key="item.id"
            :class="['notification-item', { unread: !item.is_read }]"
            @click="handleItemClick(item)"
          >
            <span class="noti-icon">{{ getTypeIcon(item.type) }}</span>
            <div class="noti-content">
              <p class="noti-text">{{ item.content }}</p>
              <span class="noti-time">{{ formatTime(item.created_at) }}</span>
            </div>
          </div>
        </div>
        <div class="dropdown-footer">
          <span class="footer-text">共 {{ totalCount }} 条通知</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/api/notification'
import { ElMessage } from 'element-plus'

const router = useRouter()
const bellRef = ref(null)
const showDropdown = ref(false)
const unreadCount = ref(0)
const notifications = ref([])
const totalCount = ref(0)
const loading = ref(false)
let pollTimer = null

const dropdownStyle = computed(() => {
  if (!bellRef.value) return {}
  const rect = bellRef.value.getBoundingClientRect()
  return {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    right: `${document.documentElement.clientWidth - rect.right}px`
  }
})

const getTypeIcon = (type) => {
  const icons = {
    debate_settled: '\uD83D\uDCE3',
    debate_reply: '\uD83D\uDCAC',
    vote_result: '\uD83D\uDDF3',
    system: '\uD83D\uDCE2',
    punishment: '\u26A0\uFE0F'
  }
  return icons[type] || '\uD83D\uDCE2'
}

const formatTime = (time) => {
  const d = new Date(time)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${d.getMonth() + 1}-${d.getDate()}`
}

const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    if (res.code === 200) unreadCount.value = res.data.count
  } catch (err) {
    console.error('获取未读数失败', err)
  }
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await getNotifications({ page: 1, limit: 10 })
    if (res.code === 200) {
      notifications.value = res.data.list
      totalCount.value = res.data.total
    }
  } catch (err) {
    console.error('获取通知列表失败', err)
  } finally {
    loading.value = false
  }
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) fetchNotifications()
}

const handleItemClick = async (item) => {
  if (!item.is_read) {
    try {
      await markAsRead(item.id)
      item.is_read = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (err) {
      console.error('标记已读失败', err)
    }
  }

  // 根据通知类型导航
  showDropdown.value = false
  const routes = {
    debate_settled: '/debates',
    debate_reply: '/debates',
    vote_result: '/debates',
    system: '/profile',
    punishment: '/profile'
  }
  const path = routes[item.type] || '/debates'
  router.push(path)
}

const handleMarkAllRead = async () => {
  try {
    await markAllAsRead()
    notifications.value.forEach(n => { n.is_read = 1 })
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

const handleClickOutside = (event) => {
  if (bellRef.value && !bellRef.value.contains(event.target)) {
    const dropdown = document.querySelector('.bell-dropdown')
    if (dropdown && !dropdown.contains(event.target)) {
      showDropdown.value = false
    }
  }
}

onMounted(() => {
  fetchUnreadCount()
  pollTimer = setInterval(fetchUnreadCount, 30000)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notification-bell {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.bell-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #555;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.bell-btn:hover {
  background: #f0f0f0;
}

.bell-icon {
  display: block;
}

.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #f56c6c;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>

<style>
.bell-dropdown {
  width: 360px;
  max-height: 460px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.dropdown-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.mark-all-btn {
  font-size: 12px;
  color: #409eff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.mark-all-btn:hover {
  background: #f0f7ff;
}

.dropdown-body {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.dropdown-loading,
.dropdown-empty {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: #f9f9f9;
}

.notification-item.unread {
  background: #f0f7ff;
}

.notification-item.unread:hover {
  background: #e6f0ff;
}

.noti-icon {
  font-size: 18px;
  line-height: 1.4;
  flex-shrink: 0;
}

.noti-content {
  flex: 1;
  min-width: 0;
}

.noti-text {
  margin: 0 0 4px;
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  word-break: break-word;
}

.noti-time {
  font-size: 12px;
  color: #999;
}

.dropdown-footer {
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.footer-text {
  font-size: 12px;
  color: #999;
}
</style>
