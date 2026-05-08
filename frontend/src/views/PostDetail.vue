<template>
  <div class="post-detail">
    <!-- 加载 -->
    <el-skeleton v-if="loading" :rows="8" animated />

    <!-- 404 -->
    <el-empty v-else-if="notFound" description="帖子不存在或已被删除">
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </el-empty>

    <!-- 帖子内容 -->
    <template v-else-if="post">
      <!-- 标题 -->
      <div class="post-header">
        <div class="post-meta-top">
          <el-tag size="small" effect="plain" type="info">
            {{ post.channel_icon }} {{ post.channel_name }}
          </el-tag>
          <el-tag v-if="post.is_pinned" size="small" type="warning">置顶</el-tag>
          <el-tag v-if="post.debate_id" size="small" type="success">辩论中</el-tag>
        </div>
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-meta">
          <span>👤 {{ post.author_name }}</span>
          <el-tag size="small" :type="levelType(post.author_level)">
            Lv{{ post.author_level }}
          </el-tag>
          <span class="time">{{ formatTime(post.created_at) }}</span>
          <span>👁 {{ post.view_count }}</span>
        </div>
      </div>

      <!-- 核心论点（如有） -->
      <el-alert
        v-if="post.thesis"
        :title="'核心论点'"
        :description="post.thesis"
        type="info"
        :closable="false"
        show-icon
        class="thesis-box"
      />

      <!-- 正文 -->
      <div class="post-content" v-html="renderedContent" />

      <!-- 来源引用 -->
      <SourceList :sources="post.sources" />

      <!-- 底部操作栏 -->
      <el-divider />
      <div class="post-actions">
        <div class="action-left">
          <QualityBadge :score="post.quality_score" />
          <span class="comment-count">💬 {{ post.comment_count || 0 }} 条评论</span>
        </div>
        <div class="action-right">
          <DebateTrigger
            :post-id="post.id"
            :debate-id="post.debate_id"
            :has-debate="!!post.debate_id"
            :can-start="userStore.userLevel >= 3"
            @start="handleStartDebate"
          />
          <el-button
            v-if="canScore"
            type="warning"
            size="small"
            plain
            @click="showScoreDialog = true"
          >
            评分
          </el-button>
        </div>
      </div>

      <!-- 评分弹窗 -->
      <el-dialog
        v-model="showScoreDialog"
        title="帖子质量评分"
        width="400px"
      >
        <div class="score-form">
          <div v-for="dim in scoreDims" :key="dim.key" class="score-item">
            <label>{{ dim.label }}</label>
            <el-slider
              v-model="scores[dim.key]"
              :min="1"
              :max="10"
              show-input
              :step="1"
            />
          </div>
        </div>
        <template #footer>
          <el-button @click="showScoreDialog = false">取消</el-button>
          <el-button type="primary" :loading="scoring" @click="submitScore">提交</el-button>
        </template>
      </el-dialog>

      <!-- 评论区域 -->
      <el-divider>讨论 ({{ post.comment_count || 0 }})</el-divider>

      <!-- 未登录提示 -->
      <el-alert
        v-if="!userStore.isLoggedIn"
        title="登录后参与讨论"
        type="info"
        :closable="false"
      >
        <template #default>
          <el-button type="primary" size="small" @click="$router.push('/register')">
            去注册/登录
          </el-button>
        </template>
      </el-alert>

      <!-- 评论输入 -->
      <CommentInput
        v-if="userStore.isLoggedIn && userStore.userLevel >= 2"
        :post-id="post.id"
        :reply-to="replyTarget"
        @submit="handleCommentSubmit"
        @cancel-reply="replyTarget = null"
      />

      <!-- 评论树 -->
      <CommentTree
        v-if="comments.length"
        :comments="commentTree"
        @reply="handleReply"
        @upvote="handleUpvote"
      />

      <el-empty v-else-if="!loadingComments" description="暂无评论，来发表第一条吧" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPostDetail, scorePost, startDebateFromPost } from '@/api/post'
import { getComments, createComment, upvoteComment } from '@/api/comment'
import { useUserStore } from '@/stores/user'
import QualityBadge from '@/components/QualityBadge.vue'
import SourceList from '@/components/SourceList.vue'
import DebateTrigger from '@/components/DebateTrigger.vue'
import CommentTree from '@/components/CommentTree.vue'
import CommentInput from '@/components/CommentInput.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const post = ref(null)
const comments = ref([])
const loading = ref(true)
const loadingComments = ref(true)
const notFound = ref(false)
const showScoreDialog = ref(false)
const scoring = ref(false)
const replyTarget = ref(null)

const scores = ref({ logic: 7, evidence: 7, expression: 7, depth: 7 })

const scoreDims = [
  { key: 'logic', label: '逻辑性' },
  { key: 'evidence', label: '证据力' },
  { key: 'expression', label: '表达力' },
  { key: 'depth', label: '深度' }
]

const canScore = computed(() =>
  userStore.isLoggedIn &&
  userStore.userLevel >= 2 &&
  post.value &&
  post.value.author_id !== userStore.userId
)

const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  return post.value.content.replace(/\n/g, '<br>')
})

const commentTree = computed(() => {
  // Build tree from flat list
  const map = {}
  const roots = []
  comments.value.forEach(c => {
    map[c.id] = { ...c, children: [] }
  })
  comments.value.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id])
    } else if (!c.parent_id) {
      roots.push(map[c.id])
    }
  })
  return roots
})

const levelType = (level) => {
  if (level >= 4) return 'danger'
  if (level >= 3) return 'warning'
  return 'success'
}

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return d.toLocaleDateString('zh-CN')
}

const loadPost = async () => {
  loading.value = true
  notFound.value = false
  try {
    const res = await getPostDetail(route.params.postId)
    if (res.code === 200) {
      post.value = res.data
    } else if (res.code === 404) {
      notFound.value = true
    } else {
      throw new Error(res.message)
    }
  } catch (err) {
    console.error('加载帖子失败:', err)
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const loadComments = async () => {
  loadingComments.value = true
  try {
    const res = await getComments(route.params.postId)
    if (res.code === 200) {
      comments.value = res.data.comments || res.data.list || []
    }
  } catch (err) {
    console.error('加载评论失败:', err)
  } finally {
    loadingComments.value = false
  }
}

const handleCommentSubmit = async (data) => {
  try {
    const payload = { content: data.content }
    if (data.parent_id) payload.parent_id = data.parent_id
    const res = await createComment(route.params.postId, payload)
    if (res.code === 200) {
      ElMessage.success('评论成功')
      replyTarget.value = null
      await loadComments()
      if (post.value) post.value.comment_count++
    } else {
      ElMessage.error(res.message || '评论失败')
    }
  } catch (err) {
    ElMessage.error('评论失败')
  }
}

const handleReply = (commentId) => {
  const c = comments.value.find(x => x.id === commentId)
  if (c) replyTarget.value = { id: commentId, name: c.author_name }
}

const handleUpvote = async (commentId) => {
  try {
    const res = await upvoteComment(commentId)
    if (res.code === 200) {
      const c = comments.value.find(x => x.id === commentId)
      if (c) c.upvote_count++
    }
  } catch (err) {
    console.error('点赞失败:', err)
  }
}

const submitScore = async () => {
  scoring.value = true
  try {
    const res = await scorePost(route.params.postId, scores.value)
    if (res.code === 200) {
      ElMessage.success('评分成功')
      showScoreDialog.value = false
      if (res.data?.quality_score !== undefined) {
        post.value.quality_score = res.data.quality_score
      }
    } else {
      ElMessage.error(res.message || '评分失败')
    }
  } catch (err) {
    ElMessage.error('评分失败')
  } finally {
    scoring.value = false
  }
}

const handleStartDebate = async () => {
  try {
    const res = await startDebateFromPost(route.params.postId)
    if (res.code === 200) {
      ElMessage.success('辩论已创建')
      if (res.data?.id) {
        router.push(`/debates/flow?topicId=${res.data.id}`)
      }
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  } catch (err) {
    ElMessage.error('创建辩论失败')
  }
}

onMounted(async () => {
  await loadPost()
  if (post.value) await loadComments()
})
</script>

<style scoped>
.post-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.post-header {
  margin-bottom: 24px;
}

.post-meta-top {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.post-title {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.4;
  margin: 0 0 12px;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #909399;
}

.time {
  color: #c0c4cc;
}

.thesis-box {
  margin-bottom: 20px;
}

.post-content {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.action-left, .action-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.comment-count {
  font-size: 14px;
  color: #909399;
}

.score-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.score-item label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}

@media (max-width: 768px) {
  .post-detail {
    padding: 12px;
  }
  .post-title {
    font-size: 22px;
  }
}
</style>
