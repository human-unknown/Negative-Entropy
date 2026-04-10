<template>
  <div class="user-management">
    <div class="search-section">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索用户名或ID"
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <button class="search-btn" @click="handleSearch">搜索</button>
    </div>

    <div v-if="selectedUser" class="user-detail">
      <div class="detail-header">
        <h3>用户详情</h3>
        <button class="close-btn" @click="selectedUser = null">✕</button>
      </div>
      
      <div class="detail-content">
        <div class="info-section">
          <h4>基本信息</h4>
          <div class="info-row">
            <span class="label">用户ID：</span>
            <span class="value">{{ selectedUser.id }}</span>
          </div>
          <div class="info-row">
            <span class="label">用户名：</span>
            <span class="value">{{ selectedUser.username }}</span>
          </div>
          <div class="info-row">
            <span class="label">等级：</span>
            <span class="value level-badge" :class="`level-${selectedUser.level}`">
              {{ getLevelText(selectedUser.level) }}
            </span>
          </div>
          <div class="info-row">
            <span class="label">经验值：</span>
            <span class="value">{{ selectedUser.exp }}</span>
          </div>
          <div class="info-row">
            <span class="label">注册时间：</span>
            <span class="value">{{ formatDate(selectedUser.created_at) }}</span>
          </div>
          <div class="info-row">
            <span class="label">账号状态：</span>
            <span class="value" :class="getStatusClass(selectedUser.status)">
              {{ getStatusText(selectedUser.status) }}
            </span>
          </div>
        </div>

        <div class="violation-section">
          <h4>违规记录</h4>
          <div v-if="selectedUser.violations && selectedUser.violations.length > 0" class="violation-list">
            <div
              v-for="violation in selectedUser.violations"
              :key="violation.id"
              class="violation-item"
            >
              <div class="violation-type">{{ violation.type }}</div>
              <div class="violation-reason">{{ violation.reason }}</div>
              <div class="violation-time">{{ formatDate(violation.created_at) }}</div>
            </div>
          </div>
          <div v-else class="no-data">暂无违规记录</div>
        </div>

        <div class="punishment-section">
          <h4>处罚记录</h4>
          <div v-if="selectedUser.punishments && selectedUser.punishments.length > 0" class="punishment-list">
            <div
              v-for="punishment in selectedUser.punishments"
              :key="punishment.id"
              class="punishment-item"
            >
              <div class="punishment-type">{{ punishment.type }}</div>
              <div class="punishment-reason">{{ punishment.reason }}</div>
              <div class="punishment-time">
                {{ formatDate(punishment.start_time) }} - 
                {{ punishment.end_time ? formatDate(punishment.end_time) : '永久' }}
              </div>
            </div>
          </div>
          <div v-else class="no-data">暂无处罚记录</div>
        </div>

        <div class="action-section">
          <h4>管理操作</h4>
          <div class="action-buttons">
            <button class="action-btn warning" @click="showActionModal('warning')">
              ⚠️ 警告
            </button>
            <button class="action-btn mute" @click="showActionModal('mute')">
              🔇 禁言
            </button>
            <button class="action-btn ban" @click="showActionModal('ban')">
              🚫 封号
            </button>
            <button class="action-btn unban" @click="showActionModal('unban')">
              ✅ 解封
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="user-list">
      <div v-if="users.length > 0" class="list-container">
        <div
          v-for="user in users"
          :key="user.id"
          class="user-item"
          @click="selectUser(user)"
        >
          <div class="user-info">
            <div class="user-name">{{ user.username }}</div>
            <div class="user-id">ID: {{ user.id }}</div>
          </div>
          <div class="user-level">
            <span class="level-badge" :class="`level-${user.level}`">
              {{ getLevelText(user.level) }}
            </span>
          </div>
          <div class="user-status">
            <span :class="getStatusClass(user.status)">
              {{ getStatusText(user.status) }}
            </span>
          </div>
        </div>
      </div>
      <div v-else class="no-data">
        {{ searchQuery ? '未找到匹配的用户' : '请输入搜索条件' }}
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ getActionTitle(currentAction) }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>处罚原因：</label>
            <textarea
              v-model="actionReason"
              placeholder="请输入处罚原因"
              rows="4"
              class="form-textarea"
            ></textarea>
          </div>
          <div v-if="currentAction === 'mute' || currentAction === 'ban'" class="form-group">
            <label>处罚时长：</label>
            <select v-model="actionDuration" class="form-select">
              <option value="1">1天</option>
              <option value="3">3天</option>
              <option value="7">7天</option>
              <option value="30">30天</option>
              <option value="0">永久</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-confirm" @click="confirmAction">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { USER_LEVEL_TEXT } from '@/constants/userLevel'

const searchQuery = ref('')
const users = ref([])
const selectedUser = ref(null)
const showModal = ref(false)
const currentAction = ref('')
const actionReason = ref('')
const actionDuration = ref('1')

const handleSearch = () => {
  console.log('搜索用户:', searchQuery.value)
  // TODO: 调用API搜索用户
}

const selectUser = (user) => {
  selectedUser.value = user
  console.log('选中用户:', user)
  // TODO: 调用API获取用户详细信息
}

const showActionModal = (action) => {
  currentAction.value = action
  actionReason.value = ''
  actionDuration.value = '1'
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  currentAction.value = ''
  actionReason.value = ''
}

const confirmAction = () => {
  console.log('执行操作:', {
    action: currentAction.value,
    userId: selectedUser.value?.id,
    reason: actionReason.value,
    duration: actionDuration.value
  })
  // TODO: 调用API执行操作
  closeModal()
}

const getLevelText = (level) => {
  return USER_LEVEL_TEXT[level] || '未知'
}

const getStatusText = (status) => {
  const statusMap = {
    normal: '正常',
    muted: '禁言中',
    banned: '已封号'
  }
  return statusMap[status] || status
}

const getStatusClass = (status) => {
  return `status-${status}`
}

const getActionTitle = (action) => {
  const titles = {
    warning: '警告用户',
    mute: '禁言用户',
    ban: '封禁用户',
    unban: '解封用户'
  }
  return titles[action] || ''
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.user-management {
  max-width: 1200px;
}

.search-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #4a90e2;
}

.search-btn {
  padding: 12px 32px;
  background: #4a90e2;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.search-btn:hover {
  background: #357abd;
}

.user-list {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.user-item:hover {
  border-color: #4a90e2;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.user-id {
  font-size: 13px;
  color: #999;
}

.user-level {
  margin-right: 24px;
}

.level-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.level-1 {
  background: #e3f2fd;
  color: #1976d2;
}

.level-2 {
  background: #f3e5f5;
  color: #7b1fa2;
}

.level-3 {
  background: #fff3e0;
  color: #e65100;
}

.level-4 {
  background: #ffebee;
  color: #c62828;
}

.user-status span {
  font-size: 14px;
  font-weight: 500;
}

.status-normal {
  color: #4caf50;
}

.status-muted {
  color: #ff9800;
}

.status-banned {
  color: #f44336;
}

.user-detail {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
}

.close-btn:hover {
  color: #333;
}

.detail-content {
  padding: 24px;
}

.info-section,
.violation-section,
.punishment-section,
.action-section {
  margin-bottom: 32px;
}

.info-section h4,
.violation-section h4,
.punishment-section h4,
.action-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.info-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-row .label {
  width: 120px;
  color: #666;
  font-size: 14px;
}

.info-row .value {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.violation-list,
.punishment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.violation-item,
.punishment-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 3px solid #ff9800;
}

.violation-type,
.punishment-type {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.violation-reason,
.punishment-reason {
  color: #666;
  font-size: 13px;
  margin-bottom: 4px;
}

.violation-time,
.punishment-time {
  color: #999;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.action-btn.warning {
  background: #fff3cd;
  color: #856404;
}

.action-btn.warning:hover {
  background: #ffeaa7;
}

.action-btn.mute {
  background: #fff3e0;
  color: #e65100;
}

.action-btn.mute:hover {
  background: #ffe0b2;
}

.action-btn.ban {
  background: #ffebee;
  color: #c62828;
}

.action-btn.ban:hover {
  background: #ffcdd2;
}

.action-btn.unban {
  background: #e8f5e9;
  color: #2e7d32;
}

.action-btn.unban:hover {
  background: #c8e6c9;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #4a90e2;
}

.form-textarea {
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: #4a90e2;
  color: #fff;
}

.btn-confirm:hover {
  background: #357abd;
}
</style>
