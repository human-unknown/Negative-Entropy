<template>
  <div class="rule-debate-speeches">
    <div class="speeches-container">
      <div class="stance-column support">
        <h3>正方 - 支持修改 ({{ supportSpeeches.length }})</h3>
        <div class="speech-list">
          <div
            v-for="speech in supportSpeeches"
            :key="speech.id"
            class="speech-item"
          >
            <div class="speech-header">
              <span class="username">{{ speech.user_name }}</span>
              <span class="time">{{ formatTime(speech.created_at) }}</span>
            </div>
            <div class="speech-content">
              {{ speech.content }}
            </div>
          </div>
        </div>
      </div>

      <div class="stance-column oppose">
        <h3>反方 - 反对修改 ({{ opposeSpeeches.length }})</h3>
        <div class="speech-list">
          <div
            v-for="speech in opposeSpeeches"
            :key="speech.id"
            class="speech-item"
          >
            <div class="speech-header">
              <span class="username">{{ speech.user_name }}</span>
              <span class="time">{{ formatTime(speech.created_at) }}</span>
            </div>
            <div class="speech-content">
              {{ speech.content }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  speeches: {
    type: Array,
    default: () => []
  }
})

const supportSpeeches = computed(() => 
  props.speeches.filter(s => s.stance === 'support')
)

const opposeSpeeches = computed(() => 
  props.speeches.filter(s => s.stance === 'oppose')
)

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style scoped>
.rule-debate-speeches {
  width: 100%;
}

.speeches-container {
  display: flex;
  gap: 20px;
}

.stance-column {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
}

.stance-column.support {
  border-color: #4caf50;
}

.stance-column.support h3 {
  color: #4caf50;
}

.stance-column.oppose {
  border-color: #f44336;
}

.stance-column.oppose h3 {
  color: #f44336;
}

.stance-column h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.speech-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.speech-item {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
}

.speech-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.username {
  font-weight: bold;
  color: #333;
}

.time {
  color: #999;
  font-size: 12px;
}

.speech-content {
  color: #555;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
