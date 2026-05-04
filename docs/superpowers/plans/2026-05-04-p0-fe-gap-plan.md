# P0 前端功能补齐 — 实现计划

**Goal:** 补齐前端三个缺口——通知系统、用户资料页内容、全局导航栏+用户菜单，使前端功能与后端 API 全面匹配。

**Architecture:** 新建 API 封装层 + 7 个新组件 + 修改 5 个现有文件。App.vue 按路由 meta 条件渲染 AppLayout 布局，无需改动各页面文件。Mock 数据同步补齐，确保无后端也能验证全功能。

**Tech Stack:** Vue 3 (Composition API, `<script setup>`) + Element Plus + Axios

---

## 文件清单

### 新建（7 个）
- `frontend/src/api/notification.js` — 通知 API 封装
- `frontend/src/components/NotificationBell.vue` — 通知铃铛+下拉面板
- `frontend/src/components/UserDropdownMenu.vue` — 用户下拉菜单
- `frontend/src/components/AppLayout.vue` — 全局导航栏布局
- `frontend/src/components/UserDebates.vue` — 我的辩论历史
- `frontend/src/components/UserStats.vue` — 用户数据统计
- `frontend/src/components/UserProfileSettings.vue` — 系统设置（反馈入口）

### 修改（5 个）
- `frontend/src/api/mock.js` — 新增通知/用户数据 mock
- `frontend/src/api/request.js` — 新增 mock 路由映射
- `frontend/src/router/index.js` — 路由 meta 增加 `requiresLayout`
- `frontend/src/App.vue` — 条件渲染 AppLayout
- `frontend/src/views/UserProfile.vue` — 充实 4 个空白 tab

---

### Task 1: api/notification.js — 通知 API 封装

**Files:**
- Create: `frontend/src/api/notification.js`

- [x] **Step 1: 创建 notification.js**
  ```javascript
  import request from './request'

  /**
   * 获取通知列表
   * @param {Object} params - { page, limit, unreadOnly }
   */
  export const getNotifications = (params) => {
    return request.get('/api/notification', { params })
  }

  /**
   * 获取未读通知数量
   */
  export const getUnreadCount = () => {
    return request.get('/api/notification/unread-count')
  }

  /**
   * 标记单条通知为已读
   * @param {number} id - 通知ID
   */
  export const markAsRead = (id) => {
    return request.put(`/api/notification/${id}/read`)
  }

  /**
   * 标记全部为已读
   */
  export const markAllAsRead = () => {
    return request.put('/api/notification/read-all')
  }

  export default { getNotifications, getUnreadCount, markAsRead, markAllAsRead }
  ```

- [x] **Step 2: 验证文件可导入**
  Run: `cd /c/Users/34270/Desktop/negative-entropy && node -e "import('./frontend/src/api/notification.js').then(m => console.log(Object.keys(m)))"`

---

### Task 2: api/mock.js — 补齐通知 + 用户数据 Mock

**Files:**
- Modify: `frontend/src/api/mock.js`（在文件已有 mockApi 对象中追加方法）

- [x] **Step 1: 追加通知相关 mock 状态和数据**
  在文件顶部 `let currentRuleDebateId = 0` 附近追加：
  ```javascript
  // 通知 Mock 数据
  let mockNotificationId = 0
  let mockNotifications = []
  const initMockNotifications = () => {
    mockNotifications = [
      { id: ++mockNotificationId, type: 'debate_settled', content: 'AI是否会取代人类工作辩论已结算', is_read: 0, created_at: new Date(Date.now() - 120000).toISOString() },
      { id: ++mockNotificationId, type: 'debate_reply', content: '李四回复了你在"远程办公"中的发言', is_read: 0, created_at: new Date(Date.now() - 600000).toISOString() },
      { id: ++mockNotificationId, type: 'vote_result', content: '你参与的"传统文化"辩论投票已完成', is_read: 1, created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: ++mockNotificationId, type: 'system', content: '欢迎加入逆熵，请完善个人资料', is_read: 0, created_at: new Date(Date.now() - 172800000).toISOString() },
      { id: ++mockNotificationId, type: 'punishment', content: '您的发言因违规被系统警告', is_read: 1, created_at: new Date(Date.now() - 259200000).toISOString() }
    ]
  }
  initMockNotifications()
  ```

- [x] **Step 2: 在 mockApi 对象中追加通知方法**
  在 mockApi 的末尾（`createRuleDebate` 之后）追加：
  ```javascript
  // 获取通知列表
  getNotifications: async (params) => {
    const page = params?.page || 1
    const limit = params?.limit || 10
    let list = [...mockNotifications]
    if (params?.unreadOnly === 'true' || params?.unreadOnly === '1') {
      list = list.filter(n => n.is_read === 0)
    }
    const start = (page - 1) * limit
    const end = start + limit
    return { code: 200, data: { list: list.slice(start, end), total: list.length, page, limit } }
  },

  // 获取未读数量
  getUnreadCount: async () => {
    const count = mockNotifications.filter(n => n.is_read === 0).length
    return { code: 200, data: { count } }
  },

  // 标记单条已读
  markAsRead: async (id) => {
    const item = mockNotifications.find(n => n.id === parseInt(id))
    if (item) item.is_read = 1
    return { code: 200, message: '已标记为已读' }
  },

  // 标记全部已读
  markAllAsRead: async () => {
    mockNotifications.forEach(n => { n.is_read = 1 })
    return { code: 200, message: '全部标记为已读' }
  },

  // 获取我的辩论列表
  getUserDebates: async (params) => {
    const page = params?.page || 1
    const limit = params?.limit || 10
    const list = mockDebates.map(d => ({
      id: d.id,
      title: d.title,
      status: d.status,
      stance: Math.random() > 0.5 ? 1 : 0,
      created_at: d.created_at,
      winner: d.status === 2 ? (Math.random() > 0.5 ? 'pro' : 'con') : null
    }))
    const start = (page - 1) * limit
    const end = start + limit
    return { code: 200, data: { debates: list.slice(start, end), total: list.length, page, limit } }
  },

  // 获取经验记录
  getExpHistory: async (params) => {
    const page = params?.page || 1
    const limit = params?.limit || 20
    const entries = [
      { id: 1, exp: 50, reason: '辩论结算奖励', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 2, exp: 20, reason: '发言奖励', created_at: new Date(Date.now() - 172800000).toISOString() },
      { id: 3, exp: -10, reason: '违规扣分', created_at: new Date(Date.now() - 259200000).toISOString() },
      { id: 4, exp: 30, reason: '逻辑测试通过', created_at: new Date(Date.now() - 345600000).toISOString() }
    ]
    const start = (page - 1) * limit
    const end = start + limit
    return { code: 200, data: { list: entries.slice(start, end), total: entries.length, page, limit } }
  },

  // 获取等级信息
  getLevelInfo: async () => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : { level: 1, exp: 0 }
    return {
      code: 200,
      data: {
        level: user.level,
        exp: user.exp,
        currentThreshold: 0,
        nextThreshold: user.level >= 3 ? null : (user.level === 1 ? 500 : 1000),
        nextLevelName: user.level >= 3 ? null : (user.level === 1 ? '进阶级' : '资深级'),
        progress: user.level >= 3 ? 100 : Math.min(Math.round((user.exp / (user.level === 1 ? 500 : 1000)) * 100), 100)
      }
    }
  }
  ```

- [x] **Step 3: 在文件顶部 `initMockData()` 之后调用 `initMockNotifications()`**
  找到 `initMockData()` 的调用处，在其后添加 `initMockNotifications()`

---

### Task 3: api/request.js — 新增 Mock 路由映射

**Files:**
- Modify: `frontend/src/api/request.js`（handleMockRequest 函数）

- [x] **Step 1: 在 handleMockRequest 末尾追加通知/用户路由**
  在最后一个 `return { code: 200, ... }` 之前添加：
  ```javascript
  // 通知系统
  if (url.includes('/notification/unread-count')) return mockApi.getUnreadCount()
  if (url.includes('/notification') && method === 'get') return mockApi.getNotifications(params)
  if (url.match(/\/notification\/\d+\/read/) && method === 'put') {
    const id = url.match(/\/notification\/(\d+)/)[1]
    return mockApi.markAsRead(id)
  }
  if (url.includes('/notification/read-all') && method === 'put') return mockApi.markAllAsRead()

  // 用户数据
  if (url.includes('/user/debates')) return mockApi.getUserDebates(params)
  if (url.includes('/user/exp')) return mockApi.getExpHistory(params)
  if (url.includes('/user/level')) return mockApi.getLevelInfo()
  ```

---

### Task 4: NotificationBell.vue — 通知铃铛下拉组件

**Files:**
- Create: `frontend/src/components/NotificationBell.vue`

- [x] **Step 1: 创建 NotificationBell.vue 模板**
  ```vue
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
  ```

---

### Task 5: UserDropdownMenu.vue — 用户下拉菜单

**Files:**
- Create: `frontend/src/components/UserDropdownMenu.vue`

- [x] **Step 1: 创建 UserDropdownMenu.vue**
  ```vue
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
  import { USER_LEVEL, USER_LEVEL_TEXT } from '@/constants/userLevel'
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
  ```

---

### Task 6: AppLayout.vue — 全局导航栏布局

**Files:**
- Create: `frontend/src/components/AppLayout.vue`

- [x] **Step 1: 创建 AppLayout.vue**
  ```vue
  <template>
    <div class="app-layout">
      <nav class="nav-bar">
        <div class="nav-left">
          <router-link to="/debates" class="logo">逆熵</router-link>
          <div class="nav-search">
            <SearchBox />
          </div>
        </div>
        <div class="nav-tabs">
          <router-link
            v-for="tab in navTabs"
            :key="tab.path"
            :to="tab.path"
            class="nav-tab"
            :class="{ active: isActive(tab.path) }"
          >
            {{ tab.label }}
          </router-link>
        </div>
        <div class="nav-right">
          <NotificationBell />
          <UserDropdownMenu />
        </div>
      </nav>
      <main class="main-content">
        <slot />
      </main>
    </div>
  </template>

  <script setup>
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import SearchBox from '@/components/SearchBox.vue'
  import NotificationBell from '@/components/NotificationBell.vue'
  import UserDropdownMenu from '@/components/UserDropdownMenu.vue'

  const route = useRoute()

  const navTabs = [
    { path: '/debates', label: '辩论列表' },
    { path: '/rules', label: '规则辩论' },
    { path: '/check/logic', label: '逻辑测试' }
  ]

  const isActive = (path) => {
    return route.path.startsWith(path)
  }

  const isAdmin = computed(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) return false
    try {
      const user = JSON.parse(userStr)
      return user.level === 4
    } catch { return false }
  })
  </script>

  <style scoped>
  .app-layout {
    min-height: 100vh;
    background: #f5f5f5;
  }

  .nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: #fff;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    align-items: center;
    padding: 0 24px;
    gap: 24px;
    z-index: 1000;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-shrink: 0;
  }

  .logo {
    font-size: 20px;
    font-weight: 700;
    color: #333;
    text-decoration: none;
    letter-spacing: 1px;
  }

  .nav-search {
    width: 320px;
  }

  .nav-tabs {
    flex: 1;
    display: flex;
    gap: 4px;
    justify-content: center;
  }

  .nav-tab {
    padding: 8px 16px;
    font-size: 14px;
    color: #666;
    text-decoration: none;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .nav-tab:hover {
    background: #f5f5f5;
    color: #333;
  }

  .nav-tab.active {
    background: #e8f0fe;
    color: #1967d2;
    font-weight: 500;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .main-content {
    padding-top: 64px;
    min-height: calc(100vh - 64px);
  }

  @media (max-width: 768px) {
    .nav-bar {
      padding: 0 12px;
      gap: 12px;
    }

    .nav-search {
      display: none;
    }

    .nav-tabs {
      justify-content: flex-start;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .nav-tab {
      flex-shrink: 0;
      padding: 6px 12px;
      font-size: 13px;
    }
  }
  </style>
  ```

---

### Task 7: router/index.js + App.vue — 路由布局条件渲染

**Files:**
- Modify: `frontend/src/router/index.js`
- Modify: `frontend/src/App.vue`

- [x] **Step 1: router/index.js — 给需要布局的路由添加 meta**
  在现有的每条路由对象中，对以下路由添加 `meta: { requiresLayout: true }`：
  - DebateList (`/debates`)
  - DebateCreate (`/debates/create`)
  - DebateFlow (`/debates/flow`)
  - CheckLogic (`/check/logic`)
  - CheckDebate (`/check/debate`)
  - CheckResult (`/check/result`)
  - UserProfile (`/profile`)
  - Admin (`/admin`)
  - RuleDebateList (`/rules`)
  - RuleDebateDetail (`/rules/debate/:id`)
  - RuleHistoryPage (`/rules/history`)

  **不添加**（保持没有 `requiresLayout`）：
  - Home (`/`)
  - Register (`/register`)
  - ResetPassword (`/reset-password`)

  示例修改（对每一条路由）：
  ```javascript
  {
    path: '/debates',
    name: 'DebateList',
    component: () => import('@/views/DebateList.vue'),
    meta: { requiresLayout: true }
  },
  ```

- [x] **Step 2: App.vue — 按条件渲染**
  修改 `App.vue` 的 `<template>`：
  ```vue
  <template>
    <div id="app">
      <div v-if="loading" class="app-loading">
        <div class="loading-spinner" />
        <p>逆熵</p>
      </div>
      <ErrorBoundary v-else-if="!mountedError">
        <AppLayout v-if="route.meta.requiresLayout">
          <router-view />
        </AppLayout>
        <router-view v-else />
      </ErrorBoundary>
      <div v-else class="app-crash">
        <div class="crash-content">
          <h2>页面加载失败</h2>
          <p>{{ mountedError.message }}</p>
          <button @click="reloadPage">重新加载</button>
        </div>
      </div>
    </div>
  </template>
  ```

  修改 `<script setup>` 导入 `useRoute`：
  ```vue
  import { ref, onMounted, onErrorCaptured } from 'vue'
  import { useRoute } from 'vue-router'
  import ErrorBoundary from '@/components/ErrorBoundary.vue'
  import AppLayout from '@/components/AppLayout.vue'

  const route = useRoute()
  const loading = ref(true)
  const mountedError = ref(null)
  // ... 其余函数保持不动
  ```

- [x] **Step 3: 验证编译**
  Run: `cd /c/Users/34270/Desktop/negative-entropy/frontend && npx vite build 2>&1 | head -30`

---

### Task 8: UserDebates.vue — 我的辩论历史

**Files:**
- Create: `frontend/src/components/UserDebates.vue`

- [x] **Step 1: 创建 UserDebates.vue**
  ```vue
  <template>
    <div class="user-debates">
      <h3 class="section-title">我的辩论</h3>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="debates.length === 0" class="empty">暂无辩论记录</div>

      <div v-else class="debate-list">
        <div v-for="item in debates" :key="item.id" class="debate-item">
          <div class="debate-info">
            <div class="debate-title">{{ item.title }}</div>
            <div class="debate-meta">
              <span :class="['status-tag', `status-${item.status}`]">
                {{ statusLabels[item.status] || '未知' }}
              </span>
              <span class="stance-tag" :class="item.stance === 1 ? 'pro' : 'con'">
                {{ item.stance === 1 ? '正方' : '反方' }}
              </span>
              <span v-if="item.winner === 'pro'" class="winner-tag">正方胜</span>
              <span v-else-if="item.winner === 'con'" class="winner-tag">反方胜</span>
              <span class="debate-time">{{ formatTime(item.created_at) }}</span>
            </div>
          </div>
          <button class="view-btn" @click="goToDebate(item.id)">查看</button>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="page === 1" @click="changePage(page - 1)">上一页</button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
      </div>
    </div>
  </template>

  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import request from '@/api/request'

  const router = useRouter()
  const debates = ref([])
  const loading = ref(false)
  const page = ref(1)
  const total = ref(0)
  const limit = 10

  const statusLabels = { 0: '待开始', 1: '进行中', 2: '已结束' }
  const totalPages = computed(() => Math.ceil(total.value / limit))

  const loadDebates = async () => {
    loading.value = true
    try {
      const res = await request.get('/api/user/debates', { params: { page: page.value, limit } })
      if (res.code === 200) {
        debates.value = res.data.debates
        total.value = res.data.total
      }
    } catch (err) {
      console.error('获取辩论历史失败', err)
    } finally {
      loading.value = false
    }
  }

  const changePage = (newPage) => { page.value = newPage; loadDebates() }
  const goToDebate = (id) => { router.push(`/debates/flow?topicId=${id}`) }
  const formatTime = (time) => {
    if (!time) return '-'
    const d = new Date(time)
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  }

  onMounted(loadDebates)
  </script>

  <style scoped>
  .user-debates {
    max-width: 800px;
  }

  .section-title {
    margin: 0 0 20px;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .loading, .empty {
    padding: 60px 20px;
    text-align: center;
    color: #999;
    font-size: 14px;
  }

  .debate-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .debate-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #f9f9f9;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    transition: box-shadow 0.2s;
  }

  .debate-item:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .debate-info {
    flex: 1;
    min-width: 0;
  }

  .debate-title {
    font-size: 15px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .debate-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .status-tag, .stance-tag, .winner-tag {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-0 { background: #fff3e0; color: #e65100; }
  .status-1 { background: #e8f5e9; color: #2e7d32; }
  .status-2 { background: #f5f5f5; color: #757575; }

  .stance-tag.pro { background: #e3f2fd; color: #1565c0; }
  .stance-tag.con { background: #fce4ec; color: #c62828; }

  .winner-tag { background: #fff8e1; color: #f9a825; }

  .debate-time {
    font-size: 12px;
    color: #999;
  }

  .view-btn {
    flex-shrink: 0;
    padding: 8px 20px;
    margin-left: 16px;
    background: #409eff;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .view-btn:hover { background: #66b1ff; }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
  }

  .pagination button {
    padding: 8px 16px;
    background: #409eff;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }

  .pagination button:disabled { background: #ddd; cursor: not-allowed; }
  .page-info { font-size: 13px; color: #666; }
  </style>
  ```

---

### Task 9: UserStats.vue — 用户数据统计

**Files:**
- Create: `frontend/src/components/UserStats.vue`

- [x] **Step 1: 创建 UserStats.vue**
  ```vue
  <template>
    <div class="user-stats">
      <h3 class="section-title">数据统计</h3>

      <div v-if="loading" class="loading">加载中...</div>

      <template v-else>
        <!-- 等级进度 -->
        <div class="level-card">
          <div class="level-info">
            <span class="level-badge" :class="`lv-${levelInfo.level}`">
              Lv.{{ levelInfo.level }}
            </span>
            <span class="level-name">{{ levelText }}</span>
          </div>
          <div class="exp-bar-wrapper">
            <div class="exp-bar">
              <div class="exp-progress" :style="{ width: levelInfo.progress + '%' }"/>
            </div>
            <div class="exp-text">
              经验值 {{ levelInfo.exp }} 点
              <span v-if="levelInfo.nextLevelName"> | 下一级({{ levelInfo.nextLevelName }})还需 {{ nextExpNeed }} 点</span>
              <span v-else> | 已达最高等级</span>
            </div>
          </div>
        </div>

        <!-- 经验记录 -->
        <div class="exp-history-section">
          <h4 class="sub-title">经验记录</h4>

          <div v-if="expHistory.length === 0" class="empty">暂无记录</div>

          <div v-else class="exp-list">
            <div v-for="item in expHistory" :key="item.id" class="exp-item">
              <span :class="['exp-amount', item.exp >= 0 ? 'positive' : 'negative']">
                {{ item.exp >= 0 ? '+' : '' }}{{ item.exp }}
              </span>
              <span class="exp-reason">{{ item.reason }}</span>
              <span class="exp-time">{{ formatTime(item.created_at) }}</span>
            </div>
          </div>

          <div v-if="expTotalPages > 1" class="pagination">
            <button :disabled="expPage === 1" @click="changeExpPage(expPage - 1)">上一页</button>
            <span class="page-info">{{ expPage }} / {{ expTotalPages }}</span>
            <button :disabled="expPage >= expTotalPages" @click="changeExpPage(expPage + 1)">下一页</button>
          </div>
        </div>
      </template>
    </div>
  </template>

  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { USER_LEVEL_TEXT } from '@/constants/userLevel'
  import request from '@/api/request'

  const loading = ref(true)
  const levelInfo = ref({ level: 1, exp: 0, progress: 0 })
  const expHistory = ref([])
  const expPage = ref(1)
  const expTotal = ref(0)
  const expLimit = 20

  const levelText = computed(() => USER_LEVEL_TEXT[levelInfo.value.level] || '')
  const expTotalPages = computed(() => Math.ceil(expTotal.value / expLimit))
  const nextExpNeed = computed(() => {
    if (levelInfo.value.nextThreshold == null) return 0
    return levelInfo.value.nextThreshold - levelInfo.value.exp
  })

  const loadLevelInfo = async () => {
    try {
      const res = await request.get('/api/user/level')
      if (res.code === 200) levelInfo.value = res.data
    } catch (err) {
      console.error('获取等级信息失败', err)
    }
  }

  const loadExpHistory = async () => {
    try {
      const res = await request.get('/api/user/exp', { params: { page: expPage.value, limit: expLimit } })
      if (res.code === 200) {
        expHistory.value = res.data.list
        expTotal.value = res.data.total
      }
    } catch (err) {
      console.error('获取经验记录失败', err)
    }
  }

  const changeExpPage = (newPage) => { expPage.value = newPage; loadExpHistory() }
  const formatTime = (time) => {
    if (!time) return '-'
    const d = new Date(time)
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  }

  onMounted(async () => {
    await Promise.all([loadLevelInfo(), loadExpHistory()])
    loading.value = false
  })
  </script>

  <style scoped>
  .user-stats { max-width: 800px; }

  .section-title {
    margin: 0 0 20px;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .loading, .empty {
    padding: 60px 20px;
    text-align: center;
    color: #999;
    font-size: 14px;
  }

  .level-card {
    padding: 24px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .level-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .level-badge {
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 700;
  }

  .lv-1 { background: #e3f2fd; color: #1565c0; }
  .lv-2 { background: #f3e5f5; color: #7b1fa2; }
  .lv-3 { background: #fff3e0; color: #e65100; }
  .lv-4 { background: #ffebee; color: #c62828; }

  .level-name {
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }

  .exp-bar-wrapper { width: 100%; }

  .exp-bar {
    height: 12px;
    background: #f0f0f0;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .exp-progress {
    height: 100%;
    background: linear-gradient(90deg, #409eff, #66b1ff);
    border-radius: 6px;
    transition: width 0.3s;
  }

  .exp-text {
    font-size: 13px;
    color: #666;
  }

  .sub-title {
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  .exp-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .exp-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: #f9f9f9;
    border-radius: 8px;
    font-size: 14px;
  }

  .exp-amount {
    font-weight: 700;
    min-width: 60px;
  }

  .exp-amount.positive { color: #67c23a; }
  .exp-amount.negative { color: #f56c6c; }

  .exp-reason { flex: 1; color: #333; }
  .exp-time { color: #999; font-size: 13px; }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 20px;
  }

  .pagination button {
    padding: 8px 16px;
    background: #409eff;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }

  .pagination button:disabled { background: #ddd; cursor: not-allowed; }
  .page-info { font-size: 13px; color: #666; }
  </style>
  ```

---

### Task 10: UserProfileSettings.vue — 系统设置（反馈入口）

**Files:**
- Create: `frontend/src/components/UserProfileSettings.vue`

- [x] **Step 1: 创建 UserProfileSettings.vue**
  ```vue
  <template>
    <div class="profile-settings">
      <h3 class="section-title">系统设置</h3>

      <div class="settings-list">
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">意见反馈</div>
            <div class="setting-desc">告诉我们您的想法，帮助我们改进平台</div>
          </div>
          <button class="setting-btn" @click="showFeedback = true">去反馈</button>
        </div>
      </div>

      <div v-if="showFeedback" class="feedback-overlay" @click.self="showFeedback = false">
        <div class="feedback-wrapper">
          <FeedbackForm />
          <button class="close-feedback-btn" @click="showFeedback = false">关闭</button>
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import { ref } from 'vue'
  import FeedbackForm from '@/components/FeedbackForm.vue'

  const showFeedback = ref(false)
  </script>

  <style scoped>
  .profile-settings { max-width: 800px; }

  .section-title {
    margin: 0 0 20px;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #f9f9f9;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
  }

  .setting-label {
    font-size: 15px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
  }

  .setting-desc {
    font-size: 13px;
    color: #999;
  }

  .setting-btn {
    padding: 8px 20px;
    background: #409eff;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
    margin-left: 16px;
  }

  .setting-btn:hover { background: #66b1ff; }

  .feedback-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 3000;
  }

  .feedback-wrapper {
    width: 90%;
    max-width: 560px;
  }

  .close-feedback-btn {
    display: block;
    margin: 16px auto 0;
    padding: 10px 32px;
    background: #fff;
    color: #666;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
  }

  .close-feedback-btn:hover {
    background: #f5f5f5;
  }
  </style>
  ```

---

### Task 11: UserProfile.vue — 充实 4 个空白 Tab

**Files:**
- Modify: `frontend/src/views/UserProfile.vue`

- [x] **Step 1: 充实 <template> 中的条件渲染**
  替换现有的 placeholder 条件：
  ```vue
  <main class="profile-main">
    <div class="content-wrapper">
      <UserInfoDisplay
        v-if="activeTab === 'info'"
        :username="userInfo.name"
        :level="userInfo.level"
        :current-exp="userInfo.exp"
        :max-exp="levelInfo.nextThreshold || 500"
        :register-time="userInfo.created_at"
        status="normal"
      />
      <UserDebates v-else-if="activeTab === 'debates'" />
      <UserStats v-else-if="activeTab === 'stats'" />
      <SecuritySettings v-else-if="activeTab === 'security'" />
      <UserProfileSettings v-else-if="activeTab === 'settings'" />
    </div>
  </main>
  ```

- [x] **Step 2: 充实 <script setup>**
  导入新组件并补充用户数据逻辑：
  ```vue
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import SecuritySettings from '../components/SecuritySettings.vue'
  import UserInfoDisplay from '../components/UserInfoDisplay.vue'
  import UserDebates from '../components/UserDebates.vue'
  import UserStats from '../components/UserStats.vue'
  import UserProfileSettings from '../components/UserProfileSettings.vue'
  import request from '@/api/request'

  const route = useRoute()
  const activeTab = ref(route.query.tab || 'info')
  const userInfo = ref({ name: '', level: 1, exp: 0, created_at: '' })
  const levelInfo = ref({ nextThreshold: 500 })

  onMounted(async () => {
    // 从 localStorage 获取基础信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        userInfo.value = user
      } catch {}
    }

    // 获取等级信息
    try {
      const res = await request.get('/api/user/level')
      if (res.code === 200) {
        levelInfo.value = res.data
        // 合并已有的 name
        userInfo.value.level = res.data.level
        userInfo.value.exp = res.data.exp
      }
    } catch (err) {
      console.error('获取等级信息失败', err)
    }
  })
  </script>
  ```

  同时删除旧的 `activeTab = ref('security')` 替换为 `activeTab = ref(route.query.tab || 'info')`

- [x] **Step 3: 验证编译**
  Run: `cd /c/Users/34270/Desktop/negative-entropy/frontend && npx vite build 2>&1 | tail -20`

---

## 自审检查

1. **Spec coverage**: ✓ 通知系统 → Task 1-4, 用户资料页 → Task 8-11, 导航栏 + 用户菜单 → Task 5-7
2. **Placeholder scan**: ✓ 所有步骤包含实际代码，无 TBD/TODO
3. **Type consistency**: ✓ 组件命名、prop 签名、API 调用路径均一致
