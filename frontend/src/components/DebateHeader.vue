<template>
  <div class="debate-header">
    <div class="title-section">
      <h1>{{ topic.title }}</h1>
      <span :class="['status', statusClass]">{{ statusText }}</span>
    </div>
    <div class="stats">
      <div class="stat-item pro">
        <span class="label">正方</span>
        <span class="count">{{ proCount }}/{{ topic.pro_limit }}</span>
      </div>
      <div class="stat-item con">
        <span class="label">反方</span>
        <span class="count">{{ conCount }}/{{ topic.con_limit }}</span>
      </div>
      <div class="stat-item audience">
        <span class="label">观众</span>
        <span class="count">{{ audienceCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { DEBATE_STATUS, DEBATE_STATUS_TEXT } from '@/constants/debateStatus'

const props = defineProps({
  topic: {
    type: Object,
    required: true
  },
  proCount: {
    type: Number,
    default: 0
  },
  conCount: {
    type: Number,
    default: 0
  },
  audienceCount: {
    type: Number,
    default: 0
  }
})

const statusText = computed(() => {
  if (props.topic.status === DEBATE_STATUS.ACTIVE) return '进行中'
  if (props.topic.status === DEBATE_STATUS.CLOSED) return '投票中'
  return DEBATE_STATUS_TEXT[props.topic.status] || '已结束'
})

const statusClass = computed(() => {
  if (props.topic.status === DEBATE_STATUS.ACTIVE) return 'active'
  if (props.topic.status === DEBATE_STATUS.CLOSED) return 'voting'
  return 'ended'
})
</script>

<style scoped>
.debate-header {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

h1 {
  font-size: 24px;
  color: var(--color-text);
  margin: 0;
  flex: 1;
  min-width: 200px;
}

.status {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.status.active {
  background: rgba(39, 174, 96, 0.2);
  color: var(--color-success);
}

.status.voting {
  background: rgba(243, 156, 18, 0.2);
  color: var(--color-warning);
}

.status.ended {
  background: rgba(153, 153, 153, 0.2);
  color: var(--color-text-secondary);
}

.stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.count {
  font-size: 20px;
  font-weight: 600;
}

.pro .count {
  color: var(--color-primary);
}

.con .count {
  color: var(--color-danger);
}

.audience .count {
  color: var(--color-warning);
}

@media (max-width: 768px) {
  .debate-header {
    padding: 20px;
  }

  h1 {
    font-size: 20px;
  }

  .title-section {
    gap: 10px;
  }

  .stats {
    gap: 20px;
    justify-content: space-around;
    width: 100%;
  }

  .count {
    font-size: 18px;
  }
}
</style>
