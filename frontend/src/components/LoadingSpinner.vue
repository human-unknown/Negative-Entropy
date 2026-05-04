<template>
  <div class="loading-spinner">
    <div class="spinner" />
    <p v-if="text">
      {{ text }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, default: '' }
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

p {
  margin-top: 12px;
  color: #666;
  font-size: 14px;
}
</style>
