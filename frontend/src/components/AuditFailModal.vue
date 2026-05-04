<template>
  <div
    v-if="visible"
    class="audit-fail-modal"
    @click.self="handleClose"
  >
    <div class="modal-content">
      <div class="modal-header">
        <span class="icon">🚫</span>
        <h3>内容审核未通过</h3>
      </div>

      <div class="modal-body">
        <p class="main-message">
          {{ message || '您的内容包含不当信息，无法发布' }}
        </p>
        
        <div
          v-if="violations && violations.length > 0"
          class="violations-list"
        >
          <div class="violations-title">
            违规原因：
          </div>
          <div class="violations-tags">
            <span
              v-for="violation in violations"
              :key="violation"
              class="violation-tag"
            >
              {{ getViolationLabel(violation) }}
            </span>
          </div>
        </div>

        <div class="tips">
          <p>💡 建议：</p>
          <ul>
            <li>使用理性、客观的表达方式</li>
            <li>避免使用攻击性、歧视性语言</li>
            <li>专注于观点本身，而非针对个人</li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn-primary"
          @click="handleClose"
        >
          我知道了
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  violations: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

// 违规类型映射
const violationLabels = {
  emotional: '情绪化',
  insult: '侮辱',
  discrimination: '歧视',
  incitement: '煽动',
  personal_attack: '人身攻击',
  labeling: '标签化',
  meaningless: '无意义内容'
}

const getViolationLabel = (type) => {
  return violationLabels[type] || type
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.audit-fail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header .icon {
  font-size: 28px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #f56c6c;
}

.modal-body {
  padding: 24px;
}

.main-message {
  margin: 0 0 20px;
  font-size: 15px;
  color: #333;
  line-height: 1.6;
}

.violations-list {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fef0f0;
  border-radius: 8px;
  border-left: 3px solid #f56c6c;
}

.violations-title {
  font-size: 14px;
  font-weight: 600;
  color: #f56c6c;
  margin-bottom: 12px;
}

.violations-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.violation-tag {
  display: inline-block;
  padding: 6px 12px;
  background-color: #f56c6c;
  color: white;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.tips {
  padding: 16px;
  background-color: #f0f9ff;
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

.tips p {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
}

.tips li {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
}

.modal-footer {
  padding: 16px 24px 24px;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  padding: 10px 24px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-primary:active {
  background-color: #3a8ee6;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
