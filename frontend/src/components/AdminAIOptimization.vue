<template>
  <div class="ai-optimization">
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">待标记</span>
        <span class="stat-value">{{ errorCount }}</span>
      </div>
    </div>

    <div
      v-if="errors.length > 0"
      class="error-list"
    >
      <div
        v-for="error in errors"
        :key="error.id"
        class="error-card"
      >
        <div class="error-header">
          <span class="error-type">{{ error.content_type }}</span>
          <span class="error-time">{{ formatDate(error.created_at) }}</span>
        </div>
        
        <div class="error-content">
          <div class="content-text">
            {{ error.content }}
          </div>
          <div class="ai-result">
            <span class="label">AI判断：</span>
            <span :class="['result', error.ai_result]">{{ getResultText(error.ai_result) }}</span>
          </div>
        </div>

        <div class="label-section">
          <div class="label-title">
            正确结果：
          </div>
          <div class="label-options">
            <button
              :class="['label-btn', { active: error.correctResult === 'pass' }]"
              @click="setCorrectResult(error, 'pass')"
            >
              通过
            </button>
            <button
              :class="['label-btn', { active: error.correctResult === 'reject' }]"
              @click="setCorrectResult(error, 'reject')"
            >
              驳回
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="no-data"
    >
      暂无审核错误记录
    </div>

    <div
      v-if="errors.length > 0"
      class="submit-bar"
    >
      <button
        class="btn-submit"
        @click="submitOptimization"
      >
        提交优化数据
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const errors = ref([])
const errorCount = ref(0)

onMounted(() => {
  loadErrors()
})

const loadErrors = async () => {
  try {
    const res = await request.get('/admin/ai/errors')
    errors.value = res.data.errors
    errorCount.value = res.data.count
  } catch (err) {
    console.error('加载审核错误记录失败:', err)
  }
}

const setCorrectResult = (error, result) => {
  error.correctResult = result
}

const submitOptimization = async () => {
  const labeled = errors.value.filter(e => e.correctResult)
  if (labeled.length === 0) {
    ElMessage.warning('请至少标记一条记录')
    return
  }
  try {
    await request.post('/admin/ai/optimize', { labels: labeled.map(e => ({ id: e.id, correctResult: e.correctResult })) })
    ElMessage.success('优化数据提交成功')
    loadErrors()
  } catch (err) {
    console.error('提交优化数据失败:', err)
  }
}

const getResultText = (result) => {
  const map = { pass: '通过', reject: '驳回', uncertain: '无法判断' }
  return map[result] || result
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.ai-optimization {
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
  color: #9c27b0;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.error-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.error-type {
  padding: 4px 12px;
  background: #f3e5f5;
  color: #7b1fa2;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.error-time {
  font-size: 13px;
  color: #999;
}

.error-content {
  margin-bottom: 16px;
}

.content-text {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
}

.ai-result {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.ai-result .label {
  color: #666;
}

.ai-result .result {
  font-weight: 500;
}

.ai-result .result.pass {
  color: #4caf50;
}

.ai-result .result.reject {
  color: #f44336;
}

.ai-result .result.uncertain {
  color: #ff9800;
}

.label-section {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.label-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.label-options {
  display: flex;
  gap: 12px;
}

.label-btn {
  padding: 8px 20px;
  border: 2px solid #e0e0e0;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.label-btn:hover {
  border-color: #9c27b0;
  color: #9c27b0;
}

.label-btn.active {
  border-color: #9c27b0;
  background: #9c27b0;
  color: #fff;
}

.no-data {
  background: #fff;
  padding: 60px;
  text-align: center;
  color: #999;
  font-size: 14px;
  border-radius: 8px;
}

.submit-bar {
  display: flex;
  justify-content: center;
}

.btn-submit {
  padding: 12px 48px;
  background: #9c27b0;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-submit:hover {
  background: #7b1fa2;
}
</style>
