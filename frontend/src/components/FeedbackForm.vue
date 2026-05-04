<template>
  <div class="feedback-form">
    <h2>意见反馈</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>反馈类型 <span class="required">*</span></label>
        <select
          v-model="form.type"
          required
        >
          <option value="">
            请选择
          </option>
          <option value="bug">
            Bug反馈
          </option>
          <option value="feature">
            功能建议
          </option>
          <option value="content">
            内容问题
          </option>
          <option value="other">
            其他
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>反馈内容 <span class="required">*</span></label>
        <textarea
          v-model="form.content"
          placeholder="请详细描述您的问题或建议（10-1000字）"
          rows="6"
          required
          minlength="10"
          maxlength="1000"
        />
        <div class="char-count">
          {{ form.content.length }}/1000
        </div>
      </div>

      <div class="form-group">
        <label>联系方式</label>
        <input
          v-model="form.contact"
          type="text"
          placeholder="选填，便于我们联系您（邮箱或手机号）"
        >
      </div>

      <button
        type="submit"
        class="submit-btn"
        :disabled="submitting"
      >
        {{ submitting ? '提交中...' : '提交反馈' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../api/request'

const emit = defineEmits(['close'])

const form = ref({
  type: '',
  content: '',
  contact: ''
})

const submitting = ref(false)

const handleSubmit = async () => {
  if (submitting.value) return

  submitting.value = true

  try {
    const response = await request.post('/feedback', form.value)

    if (response.code === 200) {
      ElMessage.success('反馈提交成功，感谢您的支持！')
      form.value = { type: '', content: '', contact: '' }
      emit('close')
    } else {
      ElMessage.error(response.message || '提交失败')
    }
  } catch (error) {
    console.error('提交反馈失败:', error)
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.feedback-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 24px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.required {
  color: #ff4d4f;
}

select,
input,
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

select:focus,
input:focus,
textarea:focus {
  outline: none;
  border-color: #1890ff;
}

textarea {
  resize: vertical;
  font-family: inherit;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.submit-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}
</style>
