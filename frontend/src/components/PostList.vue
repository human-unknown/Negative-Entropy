<template>
  <div class="post-list">
    <el-skeleton v-if="loading" :rows="5" animated />
    <el-empty v-else-if="!posts || posts.length === 0" description="暂无帖子" />
    <div v-else>
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
      />
    </div>
  </div>
</template>

<script setup>
import PostCard from './PostCard.vue'

defineProps({
  posts: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})
</script>

<style scoped>
.post-list {
  min-height: 200px;
}
</style>
