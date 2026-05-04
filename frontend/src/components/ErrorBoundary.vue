<template>
  <div
    v-if="error"
    class="error-boundary"
  >
    <div class="error-content">
      <div class="error-icon">
        ⚠️
      </div>
      <h3>出错了</h3>
      <p>{{ error.message || '页面加载失败' }}</p>
      <button
        class="retry-btn"
        @click="retry"
      >
        重试
      </button>
    </div>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err) => {
  error.value = err
  console.error('捕获错误:', err)
  return false
})

const retry = () => {
  error.value = null
  window.location.reload()
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 20px;
}

.error-content {
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 8px;
}

p {
  color: #666;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 10px 24px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #40a9ff;
}
</style>
