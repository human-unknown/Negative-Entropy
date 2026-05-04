<template>
  <div class="user-level-card">
    <div class="level-info">
      <span class="level-label">等级</span>
      <span class="level-value">{{ levelText }}</span>
    </div>
    
    <div class="exp-info">
      <div class="exp-text">
        <span>{{ currentExp }} / {{ nextLevelExp }}</span>
        <span class="exp-label">经验值</span>
      </div>
      <div class="exp-bar">
        <div
          class="exp-progress"
          :style="{ width: progressPercent + '%' }"
        />
      </div>
    </div>
    
    <div
      v-if="!isMaxLevel"
      class="next-level-info"
    >
      <span>距离{{ nextLevelText }}还需 {{ expNeeded }} 经验</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { USER_LEVEL_TEXT } from '../constants/userLevel.js'
import { LEVEL_THRESHOLDS } from '../constants/levelThresholds.js'

const props = defineProps({
  level: {
    type: Number,
    required: true
  },
  exp: {
    type: Number,
    required: true
  }
})

const levelText = computed(() => USER_LEVEL_TEXT[props.level] || '未知')

const nextLevel = computed(() => props.level + 1)

const nextLevelText = computed(() => USER_LEVEL_TEXT[nextLevel.value] || '')

const isMaxLevel = computed(() => !LEVEL_THRESHOLDS[nextLevel.value])

const currentLevelThreshold = computed(() => LEVEL_THRESHOLDS[props.level] || 0)

const nextLevelExp = computed(() => {
  if (isMaxLevel.value) return props.exp
  return LEVEL_THRESHOLDS[nextLevel.value] || 0
})

const currentExp = computed(() => props.exp)

const expNeeded = computed(() => {
  if (isMaxLevel.value) return 0
  return Math.max(0, nextLevelExp.value - currentExp.value)
})

const progressPercent = computed(() => {
  if (isMaxLevel.value) return 100
  const expInCurrentLevel = currentExp.value - currentLevelThreshold.value
  const expNeededForNextLevel = nextLevelExp.value - currentLevelThreshold.value
  return Math.min(100, Math.max(0, (expInCurrentLevel / expNeededForNextLevel) * 100))
})
</script>

<style scoped>
.user-level-card {
  padding: 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.level-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.level-label {
  font-size: 14px;
  color: #666;
}

.level-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.exp-info {
  margin-bottom: 8px;
}

.exp-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
  color: #333;
}

.exp-label {
  font-size: 12px;
  color: #666;
}

.exp-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.exp-progress {
  height: 100%;
  background: #333;
  transition: width 0.3s ease;
}

.next-level-info {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>
