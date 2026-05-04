<template>
  <div class="round-timer">
    <div class="timer-header">
      <div class="round-info">
        <span class="round-label">第 {{ currentRound.order }}/{{ totalRounds }} 轮</span>
        <span class="round-name">{{ currentRound.roundName }}</span>
      </div>
      <div
        v-if="isMyTurn"
        class="turn-badge my-turn"
      >
        我的回合
      </div>
      <div
        v-else
        class="turn-badge opponent-turn"
      >
        对方回合
      </div>
    </div>

    <div class="timer-body">
      <div class="timer-countdown">
        <svg
          :class="['timer-circle', timerClass]"
          viewBox="0 0 60 60"
          width="60"
          height="60"
        >
          <circle
            cx="30"
            cy="30"
            r="26"
            fill="none"
            stroke="var(--color-border)"
            stroke-width="4"
          />
          <circle
            cx="30"
            cy="30"
            r="26"
            fill="none"
            :stroke="circleColor"
            stroke-width="4"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            stroke-linecap="round"
            transform="rotate(-90, 30, 30)"
          />
        </svg>
        <div class="timer-text">
          {{ formatTime(remainingSec) }}
        </div>
      </div>
      <div class="timer-status">
        <div class="current-speaker">
          当前发言：{{ currentRound.speakerName || (currentRound.speakerStance === 1 ? '正方' : '反方') }}
        </div>
      </div>
    </div>

    <div
      v-if="isMyTurn && remainingSec <= 0"
      class="timeout-warning"
    >
      时间到！正在自动跳过...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { skipRound } from '@/api/round'

const props = defineProps({
  currentRound: { type: Object, required: true },
  totalRounds: { type: Number, required: true },
  userId: { type: Number, required: true },
  isMyTurn: { type: Boolean, default: false }
})

const emit = defineEmits(['skipped'])

const remainingSec = ref(props.currentRound.remainingSec || 0)
const circumference = 2 * Math.PI * 26

const dashOffset = computed(() => {
  const ratio = remainingSec.value / (props.currentRound.durationSec || 1)
  return circumference * Math.max(0, Math.min(1, 1 - ratio))
})

const timerClass = computed(() => {
  if (remainingSec.value <= 0) return 'timeout'
  if (remainingSec.value <= 30) return 'warning'
  return 'normal'
})

const circleColor = computed(() => {
  if (remainingSec.value <= 0) return 'var(--color-danger)'
  if (remainingSec.value <= 30) return 'var(--color-warning)'
  return 'var(--color-success)'
})

const formatTime = (sec) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

let timerInterval = null

watch(() => props.currentRound.roundId, () => {
  remainingSec.value = props.currentRound.remainingSec || 0
  startTimer()
}, { immediate: true })

const startTimer = () => {
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    remainingSec.value = Math.max(0, remainingSec.value - 1)

    if (remainingSec.value <= 0 && props.isMyTurn) {
      clearInterval(timerInterval)
      handleTimeout()
    }
  }, 1000)
}

const handleTimeout = async () => {
  try {
    await skipRound(props.currentRound.topicId, props.currentRound.roundId)
    emit('skipped')
  } catch (_) {
    // 静默
  }
}

onUnmounted(() => {
  clearInterval(timerInterval)
})
</script>

<style scoped>
.round-timer {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.round-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.round-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.round-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.turn-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.my-turn {
  background: rgba(39, 174, 96, 0.15);
  color: var(--color-success);
}

.opponent-turn {
  background: rgba(153, 153, 153, 0.15);
  color: var(--color-text-secondary);
}

.timer-body {
  display: flex;
  align-items: center;
  gap: 24px;
}

.timer-countdown {
  position: relative;
  flex-shrink: 0;
}

.timer-circle {
  display: block;
}

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.timer-status {
  flex: 1;
}

.current-speaker {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.timeout-warning {
  margin-top: 12px;
  padding: 8px 16px;
  background: rgba(226, 75, 74, 0.1);
  color: var(--color-danger);
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
}
</style>
