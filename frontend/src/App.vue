<template>
  <div id="app">
    <div
      v-if="loading"
      class="app-loading"
    >
      <div class="loading-spinner" />
      <p>逆熵</p>
    </div>
    <ErrorBoundary v-else-if="!mountedError">
      <router-view />
    </ErrorBoundary>
    <div
      v-else
      class="app-crash"
    >
      <div class="crash-content">
        <h2>页面加载失败</h2>
        <p>{{ mountedError.message }}</p>
        <button @click="reloadPage">
          重新加载
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onErrorCaptured } from 'vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

const loading = ref(true)
const mountedError = ref(null)

onErrorCaptured((err) => {
  mountedError.value = err
  console.error('App 级别错误:', err)
  return false
})

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 100)
})

const reloadPage = () => {
  window.location.reload()
}
</script>

<style scoped>
#app {
  width: 100%;
  min-height: 100vh;
  background: var(--color-bg, #1a1a2e);
}

.app-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: var(--color-text-secondary, #999);
  font-size: 24px;
  gap: 24px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border, #333);
  border-top-color: var(--color-primary, #4a90e2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.app-crash {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.crash-content {
  text-align: center;
  color: var(--color-text, #e0e0e0);
}

.crash-content h2 {
  margin-bottom: 12px;
}

.crash-content p {
  margin-bottom: 20px;
  color: var(--color-text-secondary, #999);
}

.crash-content button {
  padding: 10px 24px;
  background: var(--color-primary, #4a90e2);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
</style>
