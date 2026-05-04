<template>
  <div class="score-panel">
    <template v-if="scored">
      <h3>辩论结果</h3>
      <div class="result-grid">
        <div
          :class="['result-card', winner === 'pro' ? 'winner' : '']"
        >
          <div class="result-label">正方{{ winner === 'pro' ? ' \uD83C\uDFC6' : '' }}</div>
          <div class="result-score">{{ result?.pro?.total || '-' }}</div>
          <div
            v-for="(val, key) in result?.pro?.breakdown"
            :key="key"
            class="result-item"
          >
            <span>{{ key }}</span>
            <span>{{ val }}</span>
          </div>
        </div>
        <div
          :class="['result-card', winner === 'con' ? 'winner' : '']"
        >
          <div class="result-label">反方{{ winner === 'con' ? ' \uD83C\uDFC6' : '' }}</div>
          <div class="result-score">{{ result?.con?.total || '-' }}</div>
          <div
            v-for="(val, key) in result?.con?.breakdown"
            :key="key"
            class="result-item"
          >
            <span>{{ key }}</span>
            <span>{{ val }}</span>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <h3>辩论评分</h3>
      <p class="score-hint">请为正反双方按以下标准评分（1-10 分）</p>

      <div class="stance-section">
        <h4>正方评分</h4>
        <div
          v-for="(c, idx) in criteria"
          :key="c.key"
          class="score-row"
        >
          <div class="score-label">
            <span class="criterion-name">{{ c.name }}</span>
            <span class="criterion-desc">{{ c.description }}</span>
          </div>
          <el-slider
            v-model="proScores[idx]"
            :min="1"
            :max="10"
            :step="1"
            show-stops
            :marks="{ 1: '1', 5: '5', 10: '10' }"
            style="width: 200px"
          />
          <span class="score-value">{{ proScores[idx] }}</span>
        </div>
      </div>

      <div class="stance-section">
        <h4>反方评分</h4>
        <div
          v-for="(c, idx) in criteria"
          :key="c.key"
          class="score-row"
        >
          <div class="score-label">
            <span class="criterion-name">{{ c.name }}</span>
            <span class="criterion-desc">{{ c.description }}</span>
          </div>
          <el-slider
            v-model="conScores[idx]"
            :min="1"
            :max="10"
            :step="1"
            show-stops
            :marks="{ 1: '1', 5: '5', 10: '10' }"
            style="width: 200px"
          />
          <span class="score-value">{{ conScores[idx] }}</span>
        </div>
      </div>

      <div class="score-actions">
        <button
          :disabled="submitting"
          @click="handleSubmit"
        >
          {{ submitting ? '提交中...' : '提交评分' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { submitScore } from '@/api/score'

const props = defineProps({
  topicId: { type: Number, required: true },
  criteria: { type: Array, default: () => [] },
  result: { type: Object, default: null },
  scored: { type: Boolean, default: false },
  winner: { type: String, default: null }
})

const emit = defineEmits(['submitted'])

const proScores = reactive(props.criteria.map(() => 7))
const conScores = reactive(props.criteria.map(() => 7))
const submitting = ref(false)

const handleSubmit = async () => {
  const scores = []

  props.criteria.forEach((c, idx) => {
    scores.push({ targetStance: 1, criterionKey: c.key, score: proScores[idx] })
    scores.push({ targetStance: 0, criterionKey: c.key, score: conScores[idx] })
  })

  submitting.value = true
  try {
    const res = await submitScore(props.topicId, scores)
    if (res.code === 200) {
      ElMessage.success('评分已提交')
      emit('submitted')
    }
  } catch (_) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.score-panel {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
}

h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: var(--color-text);
}

.score-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

.stance-section {
  margin-bottom: 24px;
}

.stance-section h4 {
  font-size: 15px;
  margin: 0 0 16px;
  color: var(--color-text);
}

.score-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.score-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.criterion-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.criterion-desc {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.score-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  min-width: 24px;
  text-align: center;
}

.score-actions {
  text-align: right;
}

.score-actions button {
  padding: 10px 30px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.score-actions button:disabled {
  opacity: 0.6;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.result-card {
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.result-card.winner {
  border-color: var(--color-success);
  background: rgba(39, 174, 96, 0.05);
}

.result-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.result-score {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 12px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text-secondary);
  padding: 4px 0;
}
</style>
