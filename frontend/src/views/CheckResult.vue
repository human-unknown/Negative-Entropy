<template>
  <div class="result-page">
    <div class="result-container">
      <h1>审核结果</h1>
      
      <div
        v-if="loading"
        class="loading"
      >
        加载中...
      </div>
      
      <div
        v-else-if="result"
        class="result-content"
      >
        <div
          v-if="result.status === 'passed'"
          class="status-box success"
        >
          <div class="icon">
            ✓
          </div>
          <h2>审核通过</h2>
          <p>{{ result.message }}</p>
          <button
            class="action-btn"
            @click="goHome"
          >
            进入首页
          </button>
        </div>
        
        <div
          v-else-if="result.status === 'failed'"
          class="status-box failed"
        >
          <div class="icon">
            ✗
          </div>
          <h2>审核未通过</h2>
          <p>{{ result.message }}</p>
          <p
            v-if="result.retryCount"
            class="retry-info"
          >
            已尝试 {{ result.retryCount }} 次
          </p>
          <p
            v-if="result.limitUntil"
            class="limit-info"
          >
            限制至：{{ new Date(result.limitUntil).toLocaleString() }}
          </p>
        </div>
        
        <div
          v-else-if="result.status === 'incomplete'"
          class="status-box incomplete"
        >
          <div class="icon">
            !
          </div>
          <h2>审核未完成</h2>
          <p>{{ result.message }}</p>
          <div class="scores">
            <p>逻辑测试：{{ result.logicScore || '未完成' }}</p>
            <p>辩论考核：{{ result.debateScore || '未完成' }}</p>
          </div>
        </div>
        
        <div
          v-else-if="result.status === 'limited'"
          class="status-box limited"
        >
          <div class="icon">
            ⚠
          </div>
          <h2>账号受限</h2>
          <p>{{ result.message }}</p>
          <p
            v-if="result.limitUntil"
            class="limit-info"
          >
            限制至：{{ new Date(result.limitUntil).toLocaleString() }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import request from '@/api/request'

const router = useRouter()
const route = useRoute()
const userId = ref(route.query.userId)

const loading = ref(true)
const result = ref(null)

onMounted(async () => {
  try {
    const res = await request.get(`/check/result/${userId.value}`)
    if (res.code === 200) {
      result.value = res.data
    } else {
      ElMessage.error(res.message || '查询失败')
    }
  } catch (error) {
    ElMessage.error('查询失败，请重试')
  } finally {
    loading.value = false
  }
})

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  padding: 40px 20px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-container {
  max-width: 600px;
  width: 100%;
  background: #fff;
  padding: 40px;
  border-radius: 4px;
  text-align: center;
}

h1 {
  margin: 0 0 32px;
  font-size: 28px;
}

.loading {
  padding: 40px;
  color: #666;
}

.status-box {
  padding: 40px 20px;
}

.icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
}

.success .icon {
  background: #4caf50;
  color: #fff;
}

.failed .icon {
  background: #f44336;
  color: #fff;
}

.incomplete .icon {
  background: #ff9800;
  color: #fff;
}

.limited .icon {
  background: #9e9e9e;
  color: #fff;
}

h2 {
  margin: 0 0 16px;
  font-size: 24px;
}

p {
  color: #666;
  margin: 8px 0;
}

.retry-info, .limit-info {
  margin-top: 16px;
  font-size: 14px;
  color: #999;
}

.scores {
  margin-top: 24px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 4px;
}

.action-btn {
  margin-top: 32px;
  padding: 14px 40px;
  border: none;
  background: #333;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
}

.action-btn:hover {
  background: #000;
}
</style>
