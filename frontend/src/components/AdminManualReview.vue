<template>
  <div class="manual-review">
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">待复核</span>
        <span class="stat-value">{{ pendingCount }}</span>
      </div>
    </div>

    <div v-if="items.length > 0" class="review-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="review-card"
      >
        <div class="card-header">
          <span class="content-type">{{ getContentType(item.type) }}</span>
          <span class="review-time">{{ formatDate(item.created_at) }}</span>
        </div>
        
        <div class="card-content">
          <div class="content-info">
            <div class="info-row">
              <span class="label">内容ID：</span>
              <span class="value">{{ item.content_id }}</span>
            </div>
            <div class="info-row">
              <span class="label">提交者：</span>
              <span class="value">{{ item.username }} (ID: {{ item.user_id }})</span>
            </div>
            <div class="info-row">
              <span class="label">AI判断：</span>
              <span class="value uncertain">无法判断</span>
            </div>
          </div>
          
          <div class="content-text">
            <div class="text-label">原文内容：</div>
            <div class="text-box">{{ item.content }}</div>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-approve" @click="showReviewModal(item, 'approve')">
            ✓ 通过
          </button>
          <button class="btn-reject" @click="showReviewModal(item, 'reject')">
            ✕ 驳回
          </button>
        </div>
      </div>
    </div>

    <div v-else class="no-data">
      暂无待复核内容
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ reviewAction === 'approve' ? '通过复核' : '驳回内容' }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="review-info">
            <div class="info-item">
              <span class="label">内容类型：</span>
              <span class="value">{{ getContentType(selectedItem?.type) }}</span>
            </div>
            <div class="content-preview">{{ selectedItem?.content }}</div>
          </div>
          <div class="form-group">
            <label>{{ reviewAction === 'approve' ? '复核意见：' : '驳回理由：' }}</label>
            <textarea
              v-model="reviewReason"
              :placeholder="reviewAction === 'approve' ? '选填' : '必填'"
              rows="4"
              class="form-textarea"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-confirm" @click="confirmReview">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const items = ref([])
const pendingCount = ref(0)
const showModal = ref(false)
const selectedItem = ref(null)
const reviewAction = ref('')
const reviewReason = ref('')

onMounted(() => {
  loadPendingReviews()
})

const loadPendingReviews = () => {
  console.log('加载待复核内容')
  // TODO: 调用API获取待复核内容
}

const showReviewModal = (item, action) => {
  selectedItem.value = item
  reviewAction.value = action
  reviewReason.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedItem.value = null
  reviewAction.value = ''
  reviewReason.value = ''
}

const confirmReview = () => {
  if (reviewAction.value === 'reject' && !reviewReason.value.trim()) {
    alert('请填写驳回理由')
    return
  }

  console.log('复核内容:', {
    itemId: selectedItem.value?.id,
    action: reviewAction.value,
    reason: reviewReason.value
  })
  // TODO: 调用API提交复核结果
  closeModal()
  loadPendingReviews()
}

const getContentType = (type) => {
  const typeMap = {
    speech: '发言',
    topic: '话题',
    comment: '评论'
  }
  return typeMap[type] || type
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.manual-review {
  max-width: 1200px;
}

.stats-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #ff9800;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.content-type {
  padding: 4px 12px;
  background: #fff3e0;
  color: #e65100;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.review-time {
  font-size: 13px;
  color: #999;
}

.card-content {
  margin-bottom: 16px;
}

.content-info {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  padding: 6px 0;
  font-size: 14px;
}

.info-row .label {
  width: 100px;
  color: #666;
  flex-shrink: 0;
}

.info-row .value {
  flex: 1;
  color: #333;
}

.info-row .value.uncertain {
  color: #ff9800;
  font-weight: 500;
}

.content-text {
  margin-top: 12px;
}

.text-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.text-box {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 3px solid #ff9800;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.card-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-approve,
.btn-reject {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-approve {
  background: #e8f5e9;
  color: #2e7d32;
}

.btn-approve:hover {
  background: #c8e6c9;
}

.btn-reject {
  background: #ffebee;
  color: #c62828;
}

.btn-reject:hover {
  background: #ffcdd2;
}

.no-data {
  background: #fff;
  padding: 60px;
  text-align: center;
  color: #999;
  font-size: 14px;
  border-radius: 8px;
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
  max-width: 600px;
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

.modal-body {
  padding: 24px;
}

.review-info {
  margin-bottom: 20px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
}

.info-item {
  display: flex;
  font-size: 14px;
  margin-bottom: 8px;
}

.info-item .label {
  color: #666;
  margin-right: 8px;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.content-preview {
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  border-left: 3px solid #ff9800;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
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

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #4a90e2;
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
