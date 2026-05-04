<template>
  <div class="speech-list">
    <div
      v-for="speech in displaySpeeches"
      :key="speech.id"
      :class="['speech-item', getStanceClass(speech.stance, speech.role)]"
    >
      <div class="speech-bubble">
        <div class="speech-header">
          <span class="username">{{ speech.user_name || '匿名用户' }}</span>
          <span :class="['stance-tag', getStanceClass(speech.stance, speech.role)]">
            {{ getRoleText(speech.role, speech.stance) }}
          </span>
        </div>
        <div class="speech-content">
          {{ speech.content }}
        </div>
        <div class="speech-footer">
          <span class="time">{{ formatTime(speech.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  speeches: {
    type: Array,
    default: () => []
  }
})

const displaySpeeches = computed(() => {
  return props.speeches.filter(s => s.audit_status === 1)
})

const getStanceClass = (stance, role) => {
  if (role === 2) return 'audience'
  if (stance === 1) return 'pro'
  if (stance === 2) return 'con'
  return 'audience'
}

const getRoleText = (role, stance) => {
  if (role === 2) {
    return stance === 1 ? '观众·支持正方' : '观众·支持反方'
  }
  return stance === 1 ? '正方' : '反方'
}

const formatTime = (time) => {
  const d = new Date(time)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.speech-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  max-height: 600px;
  overflow-y: auto;
}

.speech-item {
  display: flex;
  width: 100%;
}

.speech-item.pro {
  justify-content: flex-start;
}

.speech-item.con {
  justify-content: flex-end;
}

.speech-item.audience {
  justify-content: center;
}

.speech-bubble {
  max-width: 70%;
  padding: 15px;
  border-radius: 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.speech-item.pro .speech-bubble {
  border-left: 3px solid var(--color-primary);
}

.speech-item.con .speech-bubble {
  border-right: 3px solid var(--color-danger);
}

.speech-item.audience .speech-bubble {
  border-left: 3px solid var(--color-warning);
  max-width: 60%;
}

.speech-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.username {
  font-weight: 600;
  color: var(--color-text);
  font-size: 14px;
}

.stance-tag {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.stance-tag.pro {
  background: rgba(74, 144, 226, 0.2);
  color: var(--color-primary);
}

.stance-tag.con {
  background: rgba(231, 76, 60, 0.2);
  color: var(--color-danger);
}

.stance-tag.audience {
  background: rgba(243, 156, 18, 0.2);
  color: var(--color-warning);
}

.audit-tag {
  padding: 2px 8px;
  background: rgba(153, 153, 153, 0.2);
  color: var(--color-text-secondary);
  border-radius: 10px;
  font-size: 12px;
}

.speech-content {
  color: var(--color-text);
  line-height: 1.6;
  font-size: 14px;
  margin-bottom: 8px;
  word-wrap: break-word;
}

.speech-footer {
  display: flex;
  justify-content: flex-end;
}

.time {
  font-size: 12px;
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .speech-list {
    padding: 15px;
    max-height: 500px;
  }

  .speech-bubble {
    max-width: 85%;
  }

  .speech-item.audience .speech-bubble {
    max-width: 80%;
  }

  .speech-content {
    font-size: 13px;
  }
}
</style>
