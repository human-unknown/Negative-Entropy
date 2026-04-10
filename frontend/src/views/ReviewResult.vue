<template>
  <div class="result-page">
    <div class="result-container">
      <div v-if="status === 'passed'" class="result-content passed">
        <div class="icon">✓</div>
        <h1 class="title">审核通过</h1>
        <p class="message">恭喜你通过入站审核，欢迎加入社区！</p>
        <button @click="goHome" class="action-btn">进入首页</button>
      </div>

      <div v-else-if="status === 'failed'" class="result-content failed">
        <div class="icon">✗</div>
        <h1 class="title">审核未通过</h1>
        <p class="message">很遗憾，你的表现未达到入站标准</p>
        <p class="retry-info">请在 24 小时后重新尝试</p>
        <p class="attempts">剩余尝试次数：{{ remainingAttempts }}/3</p>
      </div>

      <div v-else-if="status === 'banned'" class="result-content banned">
        <div class="icon">⚠</div>
        <h1 class="title">已达尝试上限</h1>
        <p class="message">你已连续 3 次未通过审核</p>
        <p class="ban-info">账号已被限制 30 天，期间无法重新申请</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  status: {
    type: String,
    default: 'passed' // passed | failed | banned
  },
  remainingAttempts: {
    type: Number,
    default: 2
  }
})

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f5f5f5;
}

.result-container {
  width: 100%;
  max-width: 500px;
  background: #fff;
  padding: 60px 40px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.result-content {
  text-align: center;
}

.icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.passed .icon {
  color: #4caf50;
}

.failed .icon {
  color: #ff9800;
}

.banned .icon {
  color: #f44336;
}

.title {
  margin: 0 0 16px;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.message {
  margin: 0 0 12px;
  font-size: 16px;
  color: #666;
}

.retry-info, .ban-info {
  margin: 0 0 12px;
  font-size: 14px;
  color: #999;
}

.attempts {
  margin: 0 0 24px;
  font-size: 14px;
  font-weight: 500;
  color: #ff9800;
}

.action-btn {
  padding: 14px 40px;
  border: none;
  background: #333;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #000;
}

@media (max-width: 768px) {
  .result-container {
    padding: 40px 24px;
  }

  .title {
    font-size: 24px;
  }
}
</style>
