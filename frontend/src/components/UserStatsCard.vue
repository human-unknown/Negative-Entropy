<template>
  <div class="user-stats-card">
    <div class="stat-item">
      <span class="stat-label">参与次数</span>
      <span class="stat-value">{{ totalDebates }}</span>
    </div>
    
    <div class="stat-item">
      <span class="stat-label">获胜次数</span>
      <span class="stat-value">{{ winCount }}</span>
    </div>
    
    <div class="stat-item">
      <span class="stat-label">胜率</span>
      <span class="stat-value">{{ winRate }}%</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalDebates: {
    type: Number,
    default: 0
  },
  winCount: {
    type: Number,
    default: 0
  }
})

const winRate = computed(() => {
  if (props.totalDebates === 0) return 0
  return ((props.winCount / props.totalDebates) * 100).toFixed(1)
})
</script>

<style scoped>
.user-stats-card {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}
</style>
