<template>
  <div class="audit-input-wrapper">
    <textarea
      v-model="localValue"
      :placeholder="placeholder"
      :maxlength="maxLength"
      :disabled="disabled"
      :class="['audit-input', statusClass]"
      @input="handleInput"
    />
    
    <div v-if="auditStatus !== 'safe'" :class="['audit-hint', statusClass]">
      <span class="hint-icon">{{ statusIcon }}</span>
      <span class="hint-text">{{ hintMessage }}</span>
    </div>

    <div class="input-footer">
      <span class="char-count">{{ localValue.length }} / {{ maxLength }}</span>
      <span v-if="checking" class="checking-text">检测中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { preCheckContent } from '@/api/audit'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['speech', 'topic', 'username'].includes(value)
  },
  placeholder: {
    type: String,
    default: '请输入内容'
  },
  maxLength: {
    type: Number,
    default: 1000
  },
  disabled: {
    type: Boolean,
    default: false
  },
  debounceTime: {
    type: Number,
    default: 500
  }
})

const emit = defineEmits(['update:modelValue', 'audit-change'])

const localValue = ref(props.modelValue)
const auditStatus = ref('safe') // 'safe' | 'warning' | 'blocked'
const hintMessage = ref('')
const checking = ref(false)
let debounceTimer = null

// 状态样式类
const statusClass = computed(() => {
  return {
    'status-safe': auditStatus.value === 'safe',
    'status-warning': auditStatus.value === 'warning',
    'status-blocked': auditStatus.value === 'blocked'
  }
})

// 状态图标
const statusIcon = computed(() => {
  return {
    safe: '',
    warning: '⚠️',
    blocked: '🚫'
  }[auditStatus.value]
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

// 监听审核状态变化，通知父组件
watch(auditStatus, (newStatus) => {
  emit('audit-change', {
    status: newStatus,
    canSubmit: newStatus !== 'blocked',
    message: hintMessage.value
  })
})

// 处理输入
const handleInput = () => {
  emit('update:modelValue', localValue.value)
  
  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // 空内容直接设为安全
  if (!localValue.value.trim()) {
    auditStatus.value = 'safe'
    hintMessage.value = ''
    checking.value = false
    return
  }

  // 防抖检测
  checking.value = true
  debounceTimer = setTimeout(async () => {
    await checkContent()
  }, props.debounceTime)
}

// 检测内容
const checkContent = async () => {
  try {
    const result = await preCheckContent({
      content: localValue.value,
      type: props.type
    })

    auditStatus.value = result.data.status
    hintMessage.value = result.data.message || ''

    // 如果有违规详情，显示具体违规类型
    if (result.data.violations && result.data.violations.length > 0) {
      const violationTypes = result.data.violations.join('、')
      hintMessage.value = `${hintMessage.value} (${violationTypes})`
    }
  } catch (error) {
    console.error('内容检测失败:', error)
    // 检测失败时保持安全状态，避免误拦截
    auditStatus.value = 'safe'
    hintMessage.value = ''
  } finally {
    checking.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  checkContent,
  getAuditStatus: () => auditStatus.value,
  canSubmit: () => auditStatus.value !== 'blocked'
})
</script>

<style scoped>
.audit-input-wrapper {
  position: relative;
  width: 100%;
}

.audit-input {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.audit-input:focus {
  outline: none;
  border-color: #409eff;
}

.audit-input.status-warning {
  border-color: #e6a23c;
  background-color: #fdf6ec;
}

.audit-input.status-blocked {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.audit-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  animation: slideIn 0.3s ease;
}

.audit-hint.status-warning {
  background-color: #fdf6ec;
  color: #e6a23c;
  border-left: 3px solid #e6a23c;
}

.audit-hint.status-blocked {
  background-color: #fef0f0;
  color: #f56c6c;
  border-left: 3px solid #f56c6c;
}

.hint-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.hint-text {
  flex: 1;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.char-count {
  color: #909399;
}

.checking-text {
  color: #409eff;
  font-style: italic;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
