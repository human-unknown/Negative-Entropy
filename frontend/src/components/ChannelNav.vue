<template>
  <div class="channel-nav">
    <el-button
      v-for="ch in channels"
      :key="ch.slug"
      :type="active === ch.slug ? 'primary' : 'default'"
      :plain="active !== ch.slug"
      size="default"
      class="channel-btn"
      @click="$emit('select', ch.slug)"
    >
      <span class="channel-icon">{{ ch.icon }}</span>
      <span>{{ ch.name }}</span>
    </el-button>
  </div>
</template>

<script setup>
defineProps({
  channels: { type: Array, required: true },
  active: { type: String, default: '' }
})
defineEmits(['select'])
</script>

<style scoped>
.channel-nav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}
.channel-btn {
  border-radius: 20px;
  transition: all 0.2s ease;
}
.channel-icon {
  margin-right: 4px;
}
</style>
