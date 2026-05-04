<template>
  <div class="template-selector">
    <label>辩论模式</label>
    <div class="template-list">
      <div
        class="template-card"
        :class="{ selected: modelValue === null }"
        @click="$emit('update:modelValue', null)"
      >
        <div class="card-title">自由辩论</div>
        <div class="card-desc">不设固定轮次，自由发言</div>
      </div>

      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="template-card"
        :class="{ selected: modelValue === tpl.id }"
        @click="handleSelect(tpl)"
      >
        <div class="card-title">{{ tpl.name }}</div>
        <div class="card-desc">{{ tpl.description }}</div>
        <div
          v-if="modelValue === tpl.id"
          class="card-preview"
        >
          <div class="preview-title">轮次预览（共 {{ getRoundCount(tpl) }} 轮）</div>
          <div
            v-for="r in getRoundsPreview(tpl)"
            :key="r.order"
            class="preview-round"
          >
            <span class="round-order">{{ r.order }}.</span>
            <span :class="['round-side', r.speaker === 'pro' ? 'pro' : 'con']">
              {{ r.speaker === 'pro' ? '正方' : '反方' }}
            </span>
            <span class="round-name">{{ r.name }}</span>
            <span class="round-time">{{ formatDuration(r.durationSec) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getTemplates } from '@/api/template'

defineProps({
  modelValue: { type: Number, default: null }
})
const emit = defineEmits(['update:modelValue'])

const templates = ref([])

onMounted(async () => {
  try {
    const res = await getTemplates()
    if (res.code === 200) {
      templates.value = res.data || []
    }
  } catch (_) {
    // 静默失败
  }
})

const handleSelect = (tpl) => {
  emit('update:modelValue', tpl.id)
}

const getRoundCount = (tpl) => {
  const config = typeof tpl.config === 'string' ? JSON.parse(tpl.config) : tpl.config
  return config?.rounds?.length || 0
}

const getRoundsPreview = (tpl) => {
  const config = typeof tpl.config === 'string' ? JSON.parse(tpl.config) : tpl.config
  return config?.rounds || []
}

const formatDuration = (sec) => {
  if (sec >= 60) return `${Math.floor(sec / 60)}分`
  return `${sec}秒`
}
</script>

<style scoped>
.template-selector {
  margin-bottom: 20px;
}

.template-selector > label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text);
  font-size: 14px;
}

.template-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.template-card {
  flex: 1;
  min-width: 200px;
  padding: 16px;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: var(--color-primary);
}

.template-card.selected {
  border-color: var(--color-primary);
  background: rgba(74, 144, 226, 0.05);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.card-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.card-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.preview-title {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.preview-round {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 3px 0;
}

.round-order {
  color: var(--color-text-tertiary);
  min-width: 16px;
}

.round-side {
  font-weight: 600;
  min-width: 28px;
}

.round-side.pro { color: var(--color-primary); }
.round-side.con { color: var(--color-danger); }

.round-name {
  color: var(--color-text);
  flex: 1;
}

.round-time {
  color: var(--color-text-tertiary);
  font-size: 11px;
}
</style>
