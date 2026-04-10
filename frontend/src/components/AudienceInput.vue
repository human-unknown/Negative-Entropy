<template>
  <div class="audience-input">
    <div class="input-header">
      <span class="title">👥 观众发言</span>
      <span :class="['word-count', { warning: content.length > 180 }]">
        {{ content.length }}/200
      </span>
    </div>
    
    <div class="rules">
      <span class="rule-item">💡 观众仅可发表观点，不可@辩手或反驳</span>
    </div>

    <div class="stance-select">
      <label>
        <input type="radio" v-model="stance" :value="1" />
        <span>支持正方</span>
      </label>
      <label>
        <input type="radio" v-model="stance" :value="2" />
        <span>支持反方</span>
      </label>
    </div>

    <textarea 
      v-model="content" 
      placeholder="请发表你的观点（10-200字）..."
      maxlength="200"
      :disabled="submitting"
    ></textarea>

    <div class="actions">
      <span v-if="pendingCount > 0" class="pending-tip">
        有 {{ pendingCount }} 条发言审核中
      </span>
      <button 
        @click="handleSubmit"
        :disabled="!canSubmit"
      >
        {{ submitting ? '提交中...' : '发言' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { createAudienceSpeech } from '@/api/debate'
import { ElMessage } from 'element-plus'

const props = defineProps({
  topicId: {
    type: Number,
    required: true
  },
  pendingCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['submitted'])

const content = ref('')
const stance = ref(1)
const submitting = ref(false)

const canSubmit = computed(() => {
  return content.value.trim().length >= 10 && 
         content.value.length <= 200 && 
         !submitting.value
})

const handleSubmit = async () => {
  if (!canSubmit.value) return

  // 检查是否包含@符号
  if (content.value.includes('@')) {
    ElMessage.warning('观众发言不可@辩手')
    return
  }

  // 检查是否包含反驳关键词
  const forbiddenWords = ['反驳', '驳斥', '你错了', '不对', '错误']
  const hasForbidden = forbiddenWords.some(word => content.value.includes(word))
  if (hasForbidden) {
    ElMessage.warning('观众发言不可反驳辩手')
    return
  }

  submitting.value = true
  try {
    await createAudienceSpeech(props.topicId, {
      content: content.value,
      stance: stance.value
    })
    ElMessage.success('发言已提交，等待审核')
    content.value = ''
    emit('submitted')
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.audience-input {
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

.rules {
  background: rgba(243, 156, 18, 0.1);
  border-left: 3px solid var(--color-warning);
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.rule-item {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.stance-select {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.stance-select label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--color-text);
  font-size: 14px;
}

.stance-select input[type="radio"] {
  cursor: pointer;
}

textarea {
  width: 100%;
  min-height: 100px;
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
  border-color: var(--color-warning);
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

.pending-tip {
  font-size: 13px;
  color: var(--color-text-secondary);
}

button {
  padding: 10px 30px;
  background: var(--color-warning);
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .audience-input {
    padding: 15px;
  }

  .stance-select {
    gap: 15px;
  }

  textarea {
    min-height: 80px;
  }

  .actions {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  button {
    width: 100%;
  }
}
</style>
