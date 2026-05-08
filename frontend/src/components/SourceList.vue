<template>
  <div v-if="sources && sources.length" class="source-list">
    <el-divider content-position="left">📚 参考资料</el-divider>
    <div v-for="(src, idx) in sources" :key="idx" class="source-item">
      <el-link :href="src.url" target="_blank" type="primary" :underline="false">
        {{ src.title || src.url }}
      </el-link>
      <span v-if="src.note" class="source-note">{{ src.note }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  sources: { type: Array, default: null }
})
</script>

<style scoped>
.source-list {
  margin-top: 8px;
}
.source-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 14px;
}
.source-note {
  color: #909399;
  font-size: 13px;
}
</style>
