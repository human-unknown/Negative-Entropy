<template>
  <div class="post-create">
    <div class="create-header">
      <h2>发表帖子</h2>
      <p class="hint">请确保内容逻辑严谨、有据可查。低质量内容将被降权或移除。</p>
    </div>

    <!-- 权限不足 -->
    <el-alert
      v-if="userStore.isLoggedIn && userStore.userLevel < 2"
      title="需要完成逻辑测试"
      type="warning"
      :closable="false"
      show-icon
    >
      <template #default>
        您需要先通过逻辑测试考核才能发帖。
        <el-button type="warning" size="small" @click="$router.push('/check/logic')">
          前往考核
        </el-button>
      </template>
    </el-alert>

    <!-- 表单 -->
    <el-form
      v-else
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="create-form"
    >
      <!-- 频道选择 -->
      <el-form-item label="频道" prop="channel_id">
        <el-select
          v-model="form.channel_id"
          placeholder="选择分类频道"
          style="width: 100%"
        >
          <el-option
            v-for="ch in channels"
            :key="ch.id"
            :label="`${ch.icon} ${ch.name}`"
            :value="ch.id"
          />
        </el-select>
      </el-form-item>

      <!-- 标题 -->
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="简明扼要地表达你的核心观点"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <!-- 正文 -->
      <el-form-item label="正文" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="12"
          placeholder="展开你的论述。请提供逻辑推理和证据支撑，避免情绪化表达。"
          maxlength="5000"
          show-word-limit
        />
      </el-form-item>

      <!-- 核心论点 -->
      <el-form-item label="核心论点（可选）">
        <el-input
          v-model="form.thesis"
          placeholder="用一句话概括你的核心论点"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <!-- 来源引用 -->
      <el-form-item label="参考文献/来源（可选）">
        <div class="source-list">
          <div
            v-for="(src, idx) in form.sources"
            :key="idx"
            class="source-row"
          >
            <el-input
              v-model="src.url"
              placeholder="URL"
              style="width: 35%"
            />
            <el-input
              v-model="src.title"
              placeholder="标题"
              style="width: 35%"
            />
            <el-input
              v-model="src.note"
              placeholder="备注（可选）"
              style="width: 25%"
            />
            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click="removeSource(idx)"
            />
          </div>
          <el-button type="primary" link @click="addSource">
            + 添加来源
          </el-button>
        </div>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="submitPost">
          发表帖子
        </el-button>
        <el-button @click="$router.push('/')">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { createPost } from '@/api/post'
import { getChannels } from '@/api/channel'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const channels = ref([])
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  channel_id: null,
  title: '',
  content: '',
  thesis: '',
  sources: []
})

const rules = {
  channel_id: [{ required: true, message: '请选择频道', trigger: 'change' }],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 200, message: '标题不能超过200字', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入正文', trigger: 'blur' },
    { min: 10, message: '正文至少10字', trigger: 'blur' }
  ]
}

const addSource = () => {
  form.sources.push({ url: '', title: '', note: '' })
}

const removeSource = (idx) => {
  form.sources.splice(idx, 1)
}

const submitPost = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const sources = form.sources.filter(s => s.url || s.title)
    const data = {
      channel_id: form.channel_id,
      title: form.title.trim(),
      content: form.content.trim(),
      thesis: form.thesis.trim() || undefined,
      sources: sources.length ? sources : undefined
    }

    const res = await createPost(data)
    if (res.code === 200) {
      ElMessage.success('发帖成功')
      const newId = res.data?.id
      if (newId) {
        router.push(`/p/${newId}`)
      } else {
        router.push('/')
      }
    } else {
      ElMessage.error(res.message || '发帖失败')
    }
  } catch (err) {
    ElMessage.error('发帖失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getChannels()
    if (res.code === 200) {
      channels.value = res.data || []
    }
  } catch (err) {
    console.error('加载频道失败:', err)
  }
})
</script>

<style scoped>
.post-create {
  max-width: 760px;
  margin: 0 auto;
  padding: 20px;
}

.create-header {
  margin-bottom: 24px;
}

.create-header h2 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 8px;
}

.hint {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.create-form {
  margin-top: 16px;
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.source-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

@media (max-width: 768px) {
  .post-create {
    padding: 12px;
  }
  .source-row {
    flex-wrap: wrap;
  }
  .source-row .el-input {
    width: 45% !important;
  }
}
</style>
