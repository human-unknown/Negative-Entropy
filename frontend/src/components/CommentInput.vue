<template>
  <div class="comment-input">
    <div v-if="replyTo" class="reply-banner">
      <span>回复 @{{ replyTo.name }}</span>
      <el-button text size="small" type="danger" @click="$emit('cancelReply')">取消</el-button>
    </div>
    <div class="input-row">
      <el-input
        v-model="text"
        type="textarea"
        :rows="3"
        :placeholder="replyTo ? `回复 @${replyTo.name}…` : '写下你的评论…'"
        :maxlength="2000"
        show-word-limit
        resize="none"
      />
      <el-button
        type="primary"
        :disabled="text.trim().length < 5"
        class="submit-btn"
        @click="submit"
      >
        发表评论
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  postId: { type: [Number, String], required: true },
  replyTo: { type: Object, default: null }
})
const emit = defineEmits(['submit', 'cancelReply'])

const text = ref('')

const submit = () => {
  const content = text.value.trim()
  if (content.length < 5) return
  emit('submit', {
    content,
    parent_id: props.replyTo?.id || null
  })
  text.value = ''
}
</script>

<style scoped>
.comment-input {
  margin-top: 16px;
}
.reply-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ecf5ff;
  padding: 8px 12px;
  border-radius: 6px 6px 0 0;
  font-size: 13px;
  color: #409eff;
}
.input-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.submit-btn {
  align-self: flex-end;
}
</style>
