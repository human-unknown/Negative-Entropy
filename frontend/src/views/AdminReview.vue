<template>
  <div class="review-page">
    <div class="page-header">
      <h2>内容复核管理</h2>
      <div class="stats">
        <span class="stat-item">待复核: {{ total }}</span>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      加载中...
    </div>

    <div
      v-else-if="reviewList.length === 0"
      class="empty"
    >
      <p>暂无待复核内容</p>
    </div>

    <div
      v-else
      class="review-list"
    >
      <div
        v-for="item in reviewList"
        :key="item.id"
        class="review-item"
      >
        <div class="item-header">
          <div class="meta">
            <span
              class="type-tag"
              :class="`type-${item.content_type}`"
            >
              {{ getContentTypeLabel(item.content_type) }}
            </span>
            <span class="user">用户: {{ item.username || `ID:${item.user_id}` }}</span>
            <span class="time">{{ formatTime(item.created_at) }}</span>
          </div>
          <div class="confidence">
            AI置信度: {{ (item.confidence * 100).toFixed(0) }}%
          </div>
        </div>

        <div class="item-content">
          <div class="content-label">
            待审核内容：
          </div>
          <div class="content-text">
            {{ item.content }}
          </div>
        </div>

        <div
          v-if="item.violations"
          class="violations"
        >
          <div class="violations-label">
            AI检测到的违规点：
          </div>
          <div class="violations-tags">
            <span
              v-for="violation in parseViolations(item.violations)"
              :key="violation"
              class="violation-tag"
            >
              {{ getViolationLabel(violation) }}
            </span>
          </div>
        </div>

        <div
          v-if="item.audit_reason"
          class="reason"
        >
          <div class="reason-label">
            AI审核原因：
          </div>
          <div class="reason-text">
            {{ item.audit_reason }}
          </div>
        </div>

        <div class="item-actions">
          <button
            class="btn-approve"
            :disabled="item.processing"
            @click="handleApprove(item)"
          >
            ✓ 通过
          </button>
          <button
            class="btn-reject"
            :disabled="item.processing"
            @click="showRejectDialog(item)"
          >
            ✗ 驳回
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="total > limit"
      class="pagination"
    >
      <button
        :disabled="page === 1"
        @click="changePage(page - 1)"
      >
        上一页
      </button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button
        :disabled="page >= totalPages"
        @click="changePage(page + 1)"
      >
        下一页
      </button>
    </div>

    <!-- 驳回对话框 -->
    <div
      v-if="rejectDialog.visible"
      class="modal"
      @click.self="closeRejectDialog"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>驳回内容</h3>
          <button
            class="close-btn"
            @click="closeRejectDialog"
          >
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>驳回原因 *</label>
            <textarea
              v-model="rejectDialog.reason"
              placeholder="请输入驳回原因（必填）"
              rows="4"
            />
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea
              v-model="rejectDialog.note"
              placeholder="可选的补充说明"
              rows="2"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn-cancel"
            @click="closeRejectDialog"
          >
            取消
          </button>
          <button
            class="btn-confirm"
            :disabled="!rejectDialog.reason.trim()"
            @click="handleReject"
          >
            确认驳回
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'

const loading = ref(false)
const reviewList = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)

const rejectDialog = ref({
  visible: false,
  item: null,
  reason: '',
  note: ''
})

const totalPages = computed(() => Math.ceil(total.value / limit.value))

// 内容类型标签
const contentTypeLabels = {
  speech: '发言',
  topic: '话题',
  username: '用户名'
}

// 违规类型标签
const violationLabels = {
  emotional: '情绪化',
  insult: '侮辱',
  discrimination: '歧视',
  incitement: '煽动',
  personal_attack: '人身攻击',
  labeling: '标签化',
  meaningless: '无意义内容'
}

const getContentTypeLabel = (type) => contentTypeLabels[type] || type
const getViolationLabel = (type) => violationLabels[type] || type

const parseViolations = (violations) => {
  try {
    return typeof violations === 'string' ? JSON.parse(violations) : violations
  } catch {
    return []
  }
}

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 加载复核列表
const loadReviewQueue = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/api/review/queue',
      method: 'GET',
      params: {
        page: page.value,
        limit: limit.value,
        status: 'pending'
      }
    })

    reviewList.value = res.data.list.map(item => ({
      ...item,
      processing: false
    }))
    total.value = res.data.total
  } catch (error) {
    console.error('加载复核列表失败:', error)
    ElMessage.error('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

// 通过复核
const handleApprove = async (item) => {
  try {
    await ElMessageBox.confirm('确认通过此内容？', '提示', { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' })
  } catch {
    return
  }

  item.processing = true
  try {
    await request({
      url: `/api/review/${item.id}/approve`,
      method: 'POST',
      data: {}
    })

    ElMessage.success('已通过')
    loadReviewQueue()
  } catch (error) {
    console.error('通过复核失败:', error)
    ElMessage.error('操作失败，请重试')
    item.processing = false
  }
}

// 显示驳回对话框
const showRejectDialog = (item) => {
  rejectDialog.value = {
    visible: true,
    item,
    reason: '',
    note: ''
  }
}

// 关闭驳回对话框
const closeRejectDialog = () => {
  rejectDialog.value = {
    visible: false,
    item: null,
    reason: '',
    note: ''
  }
}

// 驳回复核
const handleReject = async () => {
  const { item, reason, note } = rejectDialog.value

  if (!reason.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }

  item.processing = true
  try {
    await request({
      url: `/api/review/${item.id}/reject`,
      method: 'POST',
      data: { reason, note }
    })

    ElMessage.success('已驳回')
    closeRejectDialog()
    loadReviewQueue()
  } catch (error) {
    console.error('驳回复核失败:', error)
    ElMessage.error('操作失败，请重试')
    item.processing = false
  }
}

// 切换页码
const changePage = (newPage) => {
  page.value = newPage
  loadReviewQueue()
}

onMounted(() => {
  loadReviewQueue()
})
</script>

<style scoped>
.review-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  padding: 8px 16px;
  background-color: #f0f9ff;
  color: #409eff;
  border-radius: 6px;
  font-weight: 600;
}

.loading,
.empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  transition: box-shadow 0.3s;
}

.review-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.type-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.type-speech {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-topic {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.type-username {
  background-color: #e8f5e9;
  color: #388e3c;
}

.user,
.time {
  font-size: 13px;
  color: #666;
}

.confidence {
  font-size: 13px;
  color: #e6a23c;
  font-weight: 600;
}

.item-content {
  margin-bottom: 16px;
}

.content-label,
.violations-label,
.reason-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
}

.content-text {
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 6px;
  line-height: 1.6;
  color: #333;
}

.violations {
  margin-bottom: 16px;
}

.violations-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.violation-tag {
  padding: 6px 12px;
  background-color: #f56c6c;
  color: white;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.reason {
  margin-bottom: 16px;
}

.reason-text {
  padding: 12px;
  background-color: #fef0f0;
  border-left: 3px solid #f56c6c;
  border-radius: 4px;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.item-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-approve,
.btn-reject {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-approve {
  background-color: #67c23a;
  color: white;
}

.btn-approve:hover:not(:disabled) {
  background-color: #85ce61;
}

.btn-reject {
  background-color: #f56c6c;
  color: white;
}

.btn-reject:hover:not(:disabled) {
  background-color: #f78989;
}

.btn-approve:disabled,
.btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 20px;
}

.pagination button {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.pagination button:hover:not(:disabled) {
  background-color: #66b1ff;
}

.pagination button:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

/* 模态框样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.form-group textarea:focus {
  outline: none;
  border-color: #409eff;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background-color: #f0f0f0;
  color: #666;
}

.btn-cancel:hover {
  background-color: #e0e0e0;
}

.btn-confirm {
  background-color: #f56c6c;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background-color: #f78989;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
