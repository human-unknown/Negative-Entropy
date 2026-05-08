<template>
  <div class="post-card" @click="goDetail">
    <div class="post-header">
      <span class="channel-label">
        <span class="channel-icon">{{ post.channel_icon }}</span>
        {{ post.channel_name }}
      </span>
      <el-tag v-if="post.is_pinned" type="danger" size="small" effect="dark">置顶</el-tag>
      <el-tag v-if="post.debate_id" type="warning" size="small" effect="plain">辩论中</el-tag>
    </div>

    <h3 class="post-title">
      {{ post.title }}
    </h3>

    <p class="post-excerpt">{{ truncate(post.content || '', 200) }}</p>

    <div class="post-footer">
      <div class="post-author">
        <el-avatar :size="24" icon="UserFilled" />
        <span class="author-name">{{ post.author_name }}</span>
        <el-tag size="small" type="info" effect="plain">Lv{{ post.author_level }}</el-tag>
      </div>
      <div class="post-meta">
        <QualityBadge :score="post.quality_score" />
        <span class="meta-item">💬 {{ post.comment_count || 0 }}</span>
        <span class="meta-item time">{{ timeAgo(post.created_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import QualityBadge from './QualityBadge.vue'

const props = defineProps({
  post: { type: Object, required: true }
})
defineEmits(['click'])

const router = useRouter()

const goDetail = () => {
  router.push(`/p/${props.post.id}`)
}

const truncate = (str, max) => {
  return str.length > max ? str.slice(0, max) + '…' : str
}

const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.post-card {
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background 0.2s ease;
}
.post-card:hover {
  background: #f5f7fa;
}
.post-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.channel-label {
  font-size: 13px;
  color: #909399;
}
.channel-icon {
  margin-right: 2px;
}
.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.4;
}
.post-title:hover {
  color: #409eff;
}
.post-excerpt {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 12px 0;
}
.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.post-author {
  display: flex;
  align-items: center;
  gap: 8px;
}
.author-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}
.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}
.meta-item {
  font-size: 13px;
  color: #909399;
}
.time {
  color: #c0c4cc;
}
</style>
