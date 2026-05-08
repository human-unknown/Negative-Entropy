<template>
  <div class="comment-tree" :style="{ paddingLeft: depth > 0 ? '0' : '0' }">
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="comment-node"
    >
      <div class="comment-body" :style="{ marginLeft: Math.min(depth, 3) * 20 + 'px' }">
        <div class="comment-header">
          <el-avatar :size="28" icon="UserFilled" />
          <span class="comment-author">{{ comment.author_name }}</span>
          <el-tag size="small" type="info" effect="plain">Lv{{ comment.author_level }}</el-tag>
          <span class="comment-time">{{ timeAgo(comment.created_at) }}</span>
        </div>

        <p class="comment-content">{{ comment.content }}</p>

        <div class="comment-actions">
          <el-button text size="small" @click="$emit('upvote', comment.id)">
            👍 {{ comment.upvote_count || 0 }}
          </el-button>
          <el-button text size="small" type="primary" @click="$emit('reply', comment.id)">
            回复
          </el-button>
        </div>
      </div>

      <CommentTree
        v-if="comment.children && comment.children.length && depth < 2"
        :comments="comment.children"
        :depth="depth + 1"
        @reply="(id) => $emit('reply', id)"
        @upvote="(id) => $emit('upvote', id)"
      />
      <div v-else-if="comment.children && comment.children.length && depth >= 2" class="nested-summary" :style="{ marginLeft: (depth + 1) * 20 + 'px' }">
        <el-link type="primary" :underline="false" @click="$emit('reply', comment.id)">
          查看 {{ comment.children.length }} 条对话
        </el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  comments: { type: Array, default: () => [] },
  depth: { type: Number, default: 0 }
})
defineEmits(['reply', 'upvote'])

const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}
</script>

<style scoped>
.comment-node {
  margin-bottom: 4px;
}
.comment-body {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}
.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.comment-author {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
.comment-time {
  font-size: 12px;
  color: #c0c4cc;
}
.comment-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 8px 0;
  word-break: break-word;
}
.comment-actions {
  display: flex;
  gap: 4px;
}
.nested-summary {
  padding: 8px 0;
}
</style>
