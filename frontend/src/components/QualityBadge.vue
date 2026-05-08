<template>
  <el-tag v-if="score === null" type="info" size="small" class="quality-badge">未评分</el-tag>
  <el-tag v-else-if="score >= 8" type="success" size="small" class="quality-badge">{{ score }}</el-tag>
  <el-tag v-else-if="score >= 6" size="small" class="quality-badge quality-blue">{{ score }}</el-tag>
  <el-tag v-else-if="score >= 4" type="warning" size="small" class="quality-badge">{{ score }}</el-tag>
  <el-tag v-else type="danger" size="small" class="quality-badge">{{ score }}</el-tag>
</template>

<script setup>
defineProps({
  score: { type: Number, default: null }
})
</script>

<style scoped>
.quality-badge {
  font-weight: 600;
  font-size: 12px;
}
.quality-blue {
  background-color: #ecf5ff;
  border-color: #b3d8ff;
  color: #409eff;
}
</style>
