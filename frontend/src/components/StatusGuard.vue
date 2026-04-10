<template>
  <div class="status-guard">
    <div v-if="!canPerform" class="blocked-overlay">
      <div class="blocked-message">
        <span class="icon">🚫</span>
        <p>{{ tipMessage }}</p>
      </div>
    </div>
    <slot v-else></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDebateStatus } from '@/composables/useDebateStatus'

const props = defineProps({
  topic: {
    type: Object,
    required: true
  },
  action: {
    type: String,
    required: true,
    validator: (value) => ['speak', 'vote', 'join'].includes(value)
  }
})

const { canSpeak, canVote, canJoin, getStatusTip } = useDebateStatus(computed(() => props.topic))

const canPerform = computed(() => {
  if (props.action === 'speak') return canSpeak.value
  if (props.action === 'vote') return canVote.value
  if (props.action === 'join') return canJoin.value
  return false
})

const tipMessage = computed(() => {
  return getStatusTip(props.action) || '当前状态不可执行此操作'
})
</script>

<style scoped>
.status-guard {
  position: relative;
}

.blocked-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.blocked-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.icon {
  font-size: 48px;
}

.blocked-message p {
  font-size: 16px;
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0;
}

@media (max-width: 768px) {
  .blocked-overlay {
    padding: 30px 15px;
  }

  .icon {
    font-size: 40px;
  }

  .blocked-message p {
    font-size: 14px;
  }
}
</style>
