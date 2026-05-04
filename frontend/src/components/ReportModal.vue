<template>
  <div class="report-modal">
    <div
      class="modal-overlay"
      @click="$emit('close')"
    />
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">
          举报
        </h3>
        <button
          class="close-btn"
          @click="$emit('close')"
        >
          ×
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">举报类型</label>
          <select
            v-model="reportType"
            class="form-select"
          >
            <option value="">
              请选择举报类型
            </option>
            <option value="spam">
              垃圾信息
            </option>
            <option value="abuse">
              辱骂攻击
            </option>
            <option value="inappropriate">
              不当内容
            </option>
            <option value="false">
              虚假信息
            </option>
            <option value="other">
              其他
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">举报理由</label>
          <textarea 
            v-model="reason" 
            class="form-textarea"
            placeholder="请详细描述举报理由"
            maxlength="500"
            rows="5"
          />
          <div class="char-count">
            {{ reason.length }}/500
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn-cancel"
          @click="$emit('close')"
        >
          取消
        </button>
        <button 
          class="btn-submit" 
          :disabled="!canSubmit || submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '提交中...' : '提交举报' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const props = defineProps({
  targetType: { type: String, required: true }, // 'speech' | 'user' | 'debate'
  targetId: { type: Number, required: true }
});

const emit = defineEmits(['close', 'success']);

const reportType = ref('');
const reason = ref('');
const submitting = ref(false);

const canSubmit = computed(() => {
  return reportType.value && reason.value.trim().length >= 10;
});

const handleSubmit = async () => {
  if (!canSubmit.value) {
    ElMessage.warning('请选择举报类型并填写详细理由（至少10字）');
    return;
  }

  submitting.value = true;
  try {
    await request.post('/report', {
      target_type: props.targetType,
      target_id: props.targetId,
      type: reportType.value,
      reason: reason.value.trim()
    });
    ElMessage.success('举报已提交，感谢您的反馈');
    emit('success');
    emit('close');
  } catch (err) {
    ElMessage.error(err.message || '提交失败');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.report-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 500px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
}

.close-btn {
  width: 32px;
  height: 32px;
  font-size: 1.5rem;
  color: #666;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1a1a1a;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #333;
}

.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9375rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  transition: border-color 0.2s;
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1976d2;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.char-count {
  margin-top: 0.5rem;
  text-align: right;
  font-size: 0.8125rem;
  color: #999;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel,
.btn-submit {
  padding: 0.625rem 1.5rem;
  font-size: 0.9375rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  color: #666;
  background-color: #f5f5f5;
}

.btn-cancel:hover {
  background-color: #e0e0e0;
}

.btn-submit {
  color: #fff;
  background-color: #d32f2f;
}

.btn-submit:hover:not(:disabled) {
  background-color: #c62828;
}

.btn-submit:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .modal-content {
    width: 95%;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-footer {
    padding: 0.75rem 1rem;
  }

  .btn-cancel,
  .btn-submit {
    flex: 1;
  }
}
</style>
