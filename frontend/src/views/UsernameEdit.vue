<template>
  <div class="username-edit">
    <div class="edit-header">
      <h2 class="edit-title">修改用户名</h2>
    </div>

    <div class="edit-content">
      <div class="form-group">
        <label class="form-label">新用户名</label>
        <input 
          v-model="username" 
          type="text" 
          class="form-input"
          placeholder="请输入新用户名"
          maxlength="20"
          @input="validateUsername"
        />
        <div v-if="error" class="error-message">{{ error }}</div>
        <div class="form-hint">
          <p>• 必须包含真实姓氏</p>
          <p>• 禁止使用娱乐化、不严肃的名称</p>
          <p>• 提交后将进行AI审核</p>
        </div>
      </div>

      <div class="form-actions">
        <button 
          class="btn-submit" 
          :disabled="!canSubmit || submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '提交中...' : '提交审核' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const username = ref('');
const error = ref('');
const submitting = ref(false);

const COMMON_SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴',
  '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '高', '罗',
  '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹',
  '彭', '曾', '肖', '田', '董', '袁', '潘', '于', '蒋', '蔡',
  '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈'
];

const validateUsername = () => {
  error.value = '';
  
  if (!username.value) return;
  
  if (username.value.length < 2) {
    error.value = '用户名至少2个字符';
    return;
  }

  const hasSurname = COMMON_SURNAMES.some(surname => username.value.startsWith(surname));
  if (!hasSurname) {
    error.value = '用户名必须以真实姓氏开头';
    return;
  }

  const entertainmentPattern = /[!@#$%^&*()_+=\[\]{};':"\\|,.<>?\/~`]|emoji|表情|哈哈|呵呵|嘿嘿|嘻嘻/;
  if (entertainmentPattern.test(username.value)) {
    error.value = '禁止使用娱乐化、不严肃的名称';
    return;
  }
};

const canSubmit = computed(() => {
  return username.value.length >= 2 && !error.value;
});

const handleSubmit = async () => {
  validateUsername();
  if (error.value) return;

  submitting.value = true;
  try {
    await request.post('/user/username', { username: username.value });
    ElMessage.success('已提交审核，请等待审核结果');
    username.value = '';
  } catch (err) {
    ElMessage.error(err.message || '提交失败');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.username-edit {
  max-width: 600px;
  margin: 0 auto;
}

.edit-header {
  margin-bottom: 2rem;
}

.edit-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.edit-content {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9375rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #1976d2;
}

.error-message {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #d32f2f;
}

.form-hint {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.form-hint p {
  margin: 0.25rem 0;
  font-size: 0.8125rem;
  color: #666;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-submit {
  padding: 0.75rem 2rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #fff;
  background-color: #1976d2;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background-color: #1565c0;
}

.btn-submit:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .edit-content {
    padding: 1.5rem;
  }

  .edit-title {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .edit-content {
    padding: 1rem;
  }

  .btn-submit {
    width: 100%;
  }
}
</style>
