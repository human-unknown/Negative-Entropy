<template>
  <div class="debate-create">
    <h2>发布辩论话题</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-item">
        <label>标题 *</label>
        <input v-model="form.title" placeholder="请输入辩论标题" maxlength="100" />
        <span class="error" v-if="errors.title">{{ errors.title }}</span>
      </div>

      <div class="form-item">
        <label>描述 *</label>
        <textarea v-model="form.description" placeholder="请详细描述辩论内容" maxlength="500" rows="6"></textarea>
        <span class="error" v-if="errors.description">{{ errors.description }}</span>
      </div>

      <div class="form-item">
        <label>分类 *</label>
        <select v-model="form.category">
          <option value="">请选择分类</option>
          <option value="tech">科技</option>
          <option value="society">社会</option>
          <option value="culture">文化</option>
          <option value="economy">经济</option>
        </select>
        <span class="error" v-if="errors.category">{{ errors.category }}</span>
      </div>

      <div class="form-row">
        <div class="form-item">
          <label>正方人数上限 *</label>
          <input type="number" v-model.number="form.pro_limit" min="1" max="10" />
          <span class="error" v-if="errors.pro_limit">{{ errors.pro_limit }}</span>
        </div>
        <div class="form-item">
          <label>反方人数上限 *</label>
          <input type="number" v-model.number="form.con_limit" min="1" max="10" />
          <span class="error" v-if="errors.con_limit">{{ errors.con_limit }}</span>
        </div>
      </div>

      <div class="actions">
        <button type="button" @click="$router.back()">取消</button>
        <button type="submit" :disabled="submitting">{{ submitting ? '提交中...' : '提交审核' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createDebate } from '@/api/debate'
import { ElMessage } from 'element-plus'

const router = useRouter()

const form = reactive({
  title: '',
  description: '',
  category: '',
  pro_limit: 5,
  con_limit: 5
})

const errors = reactive({})
const submitting = ref(false)

const validate = () => {
  Object.keys(errors).forEach(k => delete errors[k])
  
  if (!form.title.trim()) {
    errors.title = '请输入标题'
    return false
  }
  if (form.title.length < 5) {
    errors.title = '标题至少5个字符'
    return false
  }
  
  if (!form.description.trim()) {
    errors.description = '请输入描述'
    return false
  }
  if (form.description.length < 20) {
    errors.description = '描述至少20个字符'
    return false
  }
  
  if (!form.category) {
    errors.category = '请选择分类'
    return false
  }
  
  if (form.pro_limit < 1 || form.pro_limit > 10) {
    errors.pro_limit = '人数范围1-10'
    return false
  }
  
  if (form.con_limit < 1 || form.con_limit > 10) {
    errors.con_limit = '人数范围1-10'
    return false
  }
  
  return true
}

const handleSubmit = async () => {
  if (!validate()) return
  
  submitting.value = true
  try {
    const res = await createDebate(form)
    if (res.data?.needsManualReview) {
      ElMessage.warning('话题已提交，AI检测到可能的问题，正在等待管理员复核')
    } else {
      ElMessage.success('话题发布成功，已通过AI审核')
    }
    router.push('/debates')
  } catch (err) {
    console.error(err)
    ElMessage.error(err.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.debate-create {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px 20px;
}

h2 {
  margin-bottom: 30px;
  color: var(--color-text);
}

form {
  background: var(--color-bg-secondary);
  padding: 30px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.form-item {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: 14px;
}

input, textarea, select {
  width: 100%;
  padding: 10px 15px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 14px;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--color-primary);
}

textarea {
  resize: vertical;
}

.error {
  display: block;
  margin-top: 5px;
  color: var(--color-danger);
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

.actions button {
  padding: 10px 30px;
  border-radius: 8px;
  font-size: 14px;
}

.actions button[type="button"] {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.actions button[type="submit"] {
  background: var(--color-primary);
  color: #fff;
}

.actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .debate-create {
    padding: 20px 15px;
  }

  form {
    padding: 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column-reverse;
  }

  .actions button {
    width: 100%;
  }
}
</style>
