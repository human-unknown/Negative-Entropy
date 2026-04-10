<template>
  <div class="content-review">
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">待审核</span>
        <span class="stat-value">{{ pendingCount }}</span>
      </div>
    </div>

    <div v-if="topics.length > 0" class="topic-list">
      <div
        v-for="topic in topics"
        :key="topic.id"
        class="topic-card"
      >
        <div class="topic-header">
          <h3 class="topic-title">{{ topic.title }}</h3>
          <span class="topic-time">{{ formatDate(topic.created_at) }}</span>
        </div>
        
        <div class="topic-content">
          <div class="content-row">
            <span class="label">话题ID：</span>
            <span class="value">{{ topic.id }}</span>
          </div>
          <div class="content-row">
            <span class="label">创建者：</span>
            <span class="value">{{ topic.creator_name }} (ID: {{ topic.creator_id }})</span>
          </div>
          <div class="content-row">
            <span class="label">描述：</span>
            <span class="value">{{ topic.description || '无' }}</span>
          </div>
        </div>

        <div class="topic-actions">
          <button class="btn-approve" @click="showReviewModal(topic, 'approve')">
            ✓ 通过
          </button>
          <button class="btn-reject" @click="showReviewModal(topic, 'reject')">
            ✕ 驳回
          </button>
        </div>
      </div>
    </div>

    <div v-else class="no-data">
      暂无待审核话题
    </div>

    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ reviewAction === 'approve' ? '通过审核' : '驳回话题' }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="review-info">
            <div class="info-item">
              <span class="label">话题标题：</span>
              <span class="value">{{ selectedTopic?.title }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>{{ reviewAction === 'approve' ? '审核意见：' : '驳回理由：' }}</label>
            <textarea
              v-model="reviewReason"
              :placeholder="reviewAction === 'approve' ? '选填，可留空' : '必填，请说明驳回原因'"
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

const topics = ref([])
const pendingCount = ref(0)
const showModal = ref(false)
const selectedTopic = ref(null)
const reviewAction = ref('')
const reviewReason = ref('')

onMounted(() => {
  loadPendingTopics()
})

const loadPendingTopics = () => {
  console.log('加载待审核话题')
  // TODO: 调用API获取待审核话题
}

const showReviewModal = (topic, action) => {
  selectedTopic.value = topic
  reviewAction.value = action
  reviewReason.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedTopic.value = null
  reviewAction.value = ''
  reviewReason.value = ''
}

const confirmReview = () => {
  if (reviewAction.value === 'reject' && !reviewReason.value.trim()) {
    alert('请填写驳回理由')
    return
  }

  console.log('审核话题:', {
    topicId: selectedTopic.value?.id,
    action: reviewAction.value,
    reason: reviewReason.value
  })
  // TODO: 调用API提交审核结果
  closeModal()
  loadPendingTopics()
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.content-review {
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
  color: #4a90e2;
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topic-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.topic-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.topic-time {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
  margin-left: 16px;
}

.topic-content {
  margin-bottom: 16px;
}

.content-row {
  display: flex;
  padding: 8px 0;
  font-size: 14px;
}

.content-row .label {
  width: 100px;
  color: #666;
  flex-shrink: 0;
}

.content-row .value {
  flex: 1;
  color: #333;
}

.topic-actions {
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
  max-width: 500px;
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
}

.info-item .label {
  color: #666;
  margin-right: 8px;
}

.info-item .value {
  color: #333;
  font-weight: 500;
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
