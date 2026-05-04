<template>
  <div ref="menuRef" class="user-dropdown">
    <button class="user-trigger" @click="toggleMenu">
      <div class="user-avatar">{{ userName.charAt(0) }}</div>
      <span class="user-name">{{ userName }}</span>
      <svg class="chevron" :class="{ open: showMenu }" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M7 10l5 5 5-5z"/>
      </svg>
    </button>

    <Teleport to="body">
      <div v-if="showMenu" class="dropdown-menu" :style="menuStyle">
        <div class="menu-header">
          <div class="menu-user-avatar">{{ userName.charAt(0) }}</div>
          <div class="menu-user-info">
            <div class="menu-user-name">{{ userName }}</div>
            <div class="menu-user-level">Lv.{{ userLevel }} {{ levelText }}</div>
          </div>
        </div>
        <div class="menu-divider"/>
        <div class="menu-item" @click="handleNavigate('/profile')">
          <span class="menu-item-icon">&#x2766;</span>
          <span>个人中心</span>
        </div>
        <div class="menu-item" @click="handleNavigate('/profile', 'security')">
          <span class="menu-item-icon">&#x1F512;</span>
          <span>账号安全</span>
        </div>
        <div class="menu-item" @click="handleNavigate('/profile')">
          <span class="menu-item-icon">&#x1F514;</span>
          <span>通知中心</span>
        </div>
        <div class="menu-divider"/>
        <div class="menu-item" @click="handleFeedback">
          <span class="menu-item-icon">&#x2709;</span>
          <span>意见反馈</span>
        </div>
        <div class="menu-divider"/>
        <div class="menu-item menu-item-danger" @click="handleLogout">
          <span class="menu-item-icon">&#x1F6AA;</span>
          <span>退出登录</span>
        </div>
      </div>
    </Teleport>

    <!-- 反馈弹窗 -->
    <div v-if="showFeedback" class="feedback-overlay" @click.self="showFeedback = false">
      <div class="feedback-wrapper">
        <FeedbackForm @close="showFeedback = false" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { USER_LEVEL_TEXT } from '@/constants/userLevel'
import FeedbackForm from '@/components/FeedbackForm.vue'

const router = useRouter()
const menuRef = ref(null)
const showMenu = ref(false)
const showFeedback = ref(false)

const userStr = localStorage.getItem('user')
const user = userStr ? JSON.parse(userStr) : {}
const userName = ref(user.name || '用户')
const userLevel = ref(user.level || 1)
const levelText = computed(() => USER_LEVEL_TEXT[userLevel.value] || '')

const menuStyle = computed(() => {
  if (!menuRef.value) return {}
  const rect = menuRef.value.getBoundingClientRect()
  return {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    right: `${document.documentElement.clientWidth - rect.right}px`
  }
})

const toggleMenu = () => { showMenu.value = !showMenu.value }

const handleNavigate = (path, tab) => {
  showMenu.value = false
  if (tab) {
    router.push({ path, query: { tab } })
  } else {
    router.push(path)
  }
}

const handleFeedback = () => {
  showMenu.value = false
  showFeedback.value = true
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  showMenu.value = false
  router.push('/')
}

const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    const dropdown = document.querySelector('.dropdown-menu')
    if (dropdown && !dropdown.contains(event.target)) {
      showMenu.value = false
    }
  }
}

onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>

<style scoped>
.user-dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-trigger:hover {
  background: #f0f0f0;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.user-name {
  font-size: 14px;
  color: #333;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  color: #999;
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(180deg);
}
</style>

<style>
.dropdown-menu {
  width: 240px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 2000;
  overflow: hidden;
}

.menu-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.menu-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.menu-user-info {
  flex: 1;
  min-width: 0;
}

.menu-user-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.menu-user-level {
  font-size: 12px;
  color: #999;
}

.menu-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background 0.15s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item-danger {
  color: #f56c6c;
}

.menu-item-danger:hover {
  background: #fef0f0;
}

.menu-item-icon {
  width: 20px;
  text-align: center;
  font-size: 16px;
}

.feedback-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.feedback-wrapper {
  width: 90%;
  max-width: 560px;
}
</style>
