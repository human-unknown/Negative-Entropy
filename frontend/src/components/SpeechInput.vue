<template>
  <div class="speech-input">
    <div class="input-header">
      <span class="title">辩手发言</span>
      <span :class="['word-count', { warning: content.length > WARNING_THRESHOLD }]">
        {{ content.length }}/{{ MAX_LENGTH }}
      </span>
    </div>
    <textarea 
      v-model="content" 
      placeholder="请输入你的观点（10-500字）..."
      maxlength="500"
      :disabled="cooldown > 0 || submitting"
    />
    <div class="actions">
      <span
        v-if="cooldown > 0"
        class="cooldown"
      >冷却中 {{ cooldown }}s</span>
      <button 
        :disabled="!canSubmit"
        type="button"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '发言' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { createSpeech } from '@/api/debate'
import { ElMessage } from 'element-plus'

const MAX_LENGTH = 500
const WARNING_THRESHOLD = Math.floor(MAX_LENGTH * 0.9)

const props = defineProps({
  topicId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['submitted'])

const content = ref('')
const cooldown = ref(0)
const submitting = ref(false)
let timer = null

const canSubmit = computed(() => {
  return content.value.trim().length >= 10 && 
         content.value.length <= MAX_LENGTH && 
         cooldown.value === 0 && 
         !submitting.value
})

const startCooldown = () => {
  cooldown.value = 60
  const _timer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0) {
      clearInterval(_timer)
      timer = null
    }
  }, 1000)
  timer = _timer
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  try {
    await createSpeech(props.topicId, content.value)
    ElMessage.success('发言已提交，等待审核')
    content.value = ''
    startCooldown()
    emit('submitted')
  } catch (err) {
    console.error('发言提交失败:', err)
    const msg = err?.response?.data?.message || '发言提交失败，请稍后重试'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.speech-input {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.word-count {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.word-count.warning {
  color: var(--color-warning);
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 14px;
  resize: vertical;
  margin-bottom: 12px;
}

textarea:focus {
  border-color: var(--color-primary);
}

textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cooldown {
  font-size: 13px;
  color: var(--color-warning);
}

button {
  padding: 10px 30px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .speech-input {
    padding: 15px;
  }

  textarea {
    min-height: 100px;
  }

  button {
    padding: 8px 24px;
  }
}
</style>
