<template>
  <div class="debate-flow">
    <h2>辩论流程</h2>

    <!-- 轮次计时器（模板辩论时显示） -->
    <DebateRoundTimer
      v-if="isTemplateDebate && currentRound && currentRound.status === 'active'"
      :current-round="{ ...currentRound, topicId: mockTopic.id }"
      :total-rounds="totalRounds"
      :user-id="userId"
      :is-my-turn="isMyTurn"
      @skipped="loadCurrentRound"
    />

    <!-- 步骤1: 选择立场 -->
    <div v-if="step === 1" class="step">
      <div class="step-title">步骤1: 选择立场</div>
      <StanceSelector
        :topic="mockTopic"
        :pro-count="proCount"
        :con-count="conCount"
        :audience-count="audienceCount"
        @joined="handleJoined"
      />
    </div>

    <!-- 步骤2: 发言 -->
    <div v-if="step === 2" class="step">
      <div class="step-title">步骤2: 发言</div>

      <!-- 模板辩论：按轮次发言 -->
      <template v-if="isTemplateDebate">
        <div v-if="isMyTurn && currentRound?.status === 'active'" class="round-speech-input">
          <div class="round-speech-header">
            当前轮次：{{ currentRound.roundName }}
            <span class="remaining-time">剩余 {{ formatTime(currentRound.remainingSec) }}</span>
          </div>
          <textarea
            v-model="speechContent"
            placeholder="请输入你的发言..."
            maxlength="1000"
            rows="6"
          />
          <div class="speech-actions">
            <button :disabled="!speechContent.trim() || submitting" @click="handleRoundSubmit">
              {{ submitting ? '提交中...' : '提交发言' }}
            </button>
          </div>
        </div>
        <div v-else-if="currentRound?.status === 'active'" class="waiting-hint">
          等待对方发言...
        </div>
        <div v-else class="round-complete">辩论轮次已全部完成</div>
      </template>

      <!-- 自由辩论：保持原有模式 -->
      <template v-else>
        <div v-if="userStance !== 3">
          <SpeechInput :topic-id="mockTopic.id" @submitted="handleSpeechSubmitted" />
        </div>
        <div v-else>
          <AudienceInput
            :topic-id="mockTopic.id"
            :pending-count="pendingCount"
            @submitted="handleSpeechSubmitted"
          />
        </div>
      </template>
    </div>

    <!-- 赛程进度（模板辩论时显示） -->
    <div v-if="isTemplateDebate && rounds.length" class="round-progress">
      <div class="progress-title">辩论赛程</div>
      <div class="progress-steps">
        <div
          v-for="r in rounds"
          :key="r.id"
          :class="['progress-step', getRoundStatusClass(r)]"
        >
          <div class="step-dot" />
          <div class="step-label">{{ r.round_name }}</div>
          <div class="step-speaker">{{ r.speaker_stance === 1 ? '正' : '反' }}</div>
        </div>
      </div>
    </div>

    <!-- 步骤3: 发言列表展示 -->
    <div v-if="step >= 2" class="step">
      <div class="step-title">步骤3: 发言展示</div>
      <div v-if="speeches.length === 0" class="empty-tip">暂无发言</div>
      <SpeechList v-else :speeches="speeches" />
      <button class="refresh-btn" @click="refreshSpeeches"> 刷新发言</button>
    </div>

    <!-- 评分面板（模板辩论结束后） -->
    <DebateScorePanel
      v-if="showScorePanel"
      :topic-id="mockTopic.id"
      :criteria="scoreCriteria"
      :result="scoreResult"
      :scored="hasScored"
      :winner="scoreWinner"
      @submitted="handleScoreSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import StanceSelector from '@/components/StanceSelector.vue'
import SpeechInput from '@/components/SpeechInput.vue'
import AudienceInput from '@/components/AudienceInput.vue'
import SpeechList from '@/components/SpeechList.vue'
import DebateRoundTimer from '@/components/DebateRoundTimer.vue'
import DebateScorePanel from '@/components/DebateScorePanel.vue'
import { getSpeeches, getDebateDetail } from '@/api/debate'
import { getCurrentRound, getRounds, submitRound } from '@/api/round'
import { getScoreResult } from '@/api/score'

const route = useRoute()
const step = ref(1)
const userStance = ref(0)
const proCount = ref(0)
const conCount = ref(0)
const audienceCount = ref(0)
const pendingCount = ref(0)
const speeches = ref([])

const mockTopic = ref({
  id: parseInt(route.query.topicId) || 1,
  title: '人工智能是否会取代人类工作？',
  pro_limit: 5,
  con_limit: 5,
  status: 0
})

// 模板辩论状态
const isTemplateDebate = ref(false)
const currentRound = ref(null)
const rounds = ref([])
const totalRounds = ref(0)
const speechContent = ref('')
const submitting = ref(false)

// 评分状态
const showScorePanel = ref(false)
const scoreResult = ref(null)
const scoreCriteria = ref([])
const scoreWinner = ref(null)
const hasScored = ref(false)

const userId = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr).id : null
})

const isMyTurn = computed(() => {
  if (!currentRound.value) return false
  return currentRound.value.speakerId === userId.value
})

const getStanceText = (stance) => {
  if (stance === 1) return '正方'
  if (stance === 2) return '反方'
  if (stance === 3) return '观众'
  return '未选择'
}

const handleJoined = async (stance) => {
  userStance.value = stance
  if (stance === 1) proCount.value++
  else if (stance === 2) conCount.value++
  else if (stance === 3) audienceCount.value++

  step.value = 2
  ElMessage.success(`已加入${getStanceText(stance)}`)
  await checkTemplateDebate()
}

const checkTemplateDebate = async () => {
  try {
    const res = await getCurrentRound(mockTopic.value.id)
    if (res.code === 200 && res.data && !res.data.isFreeDebate) {
      isTemplateDebate.value = true
      if (res.data.debateComplete) {
        showScorePanel.value = true
        await loadScoreResult()
      } else {
        currentRound.value = res.data
      }
      await loadRounds()
    }
  } catch (_) {
    // 不是模板辩论，保持自由模式
  }
}

const loadCurrentRound = async () => {
  try {
    const res = await getCurrentRound(mockTopic.value.id)
    if (res.code === 200) {
      if (res.data?.debateComplete) {
        currentRound.value = null
        showScorePanel.value = true
        await loadScoreResult()
      } else {
        currentRound.value = res.data
      }
    }
  } catch (_) {}
}

const loadRounds = async () => {
  try {
    const res = await getRounds(mockTopic.value.id)
    if (res.code === 200) {
      rounds.value = res.data || []
      totalRounds.value = rounds.value.length
    }
  } catch (_) {}
}

const handleRoundSubmit = async () => {
  if (!speechContent.value.trim() || submitting.value) return
  submitting.value = true
  try {
    const res = await submitRound(mockTopic.value.id, currentRound.value.roundId, speechContent.value)
    if (res.code === 200) {
      speechContent.value = ''
      ElMessage.success('发言已提交')
      if (res.data?.debateComplete) {
        currentRound.value = null
        showScorePanel.value = true
        await loadScoreResult()
      } else {
        await loadCurrentRound()
      }
      await loadRounds()
      await refreshSpeeches()
    }
  } catch (_) {
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

const handleSpeechSubmitted = async () => {
  ElMessage.success('发言已提交')
  setTimeout(() => { refreshSpeeches() }, 500)
}

const refreshSpeeches = async () => {
  try {
    const res = await getSpeeches(mockTopic.value.id)
    if (res.code === 200) {
      speeches.value = res.data.list || res.data || []
    }
  } catch (err) {
    console.error('刷新发言失败:', err)
  }
}

const getRoundStatusClass = (r) => {
  if (r.status === 'active') return 'active'
  if (['completed', 'timeout', 'skipped'].includes(r.status)) return 'done'
  return 'pending'
}

const loadScoreResult = async () => {
  try {
    const res = await getScoreResult(mockTopic.value.id)
    if (res.code === 200) {
      scoreResult.value = res.data?.scores
      scoreCriteria.value = res.data?.criteria || []
      scoreWinner.value = res.data?.winner
      hasScored.value = !!(res.data?.scores?.pro?.voterCount)
    }
  } catch (_) {}
}

const handleScoreSubmitted = () => {
  hasScored.value = true
  loadScoreResult()
}

const formatTime = (sec) => {
  const m = Math.floor((sec || 0) / 60)
  const s = (sec || 0) % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

onMounted(async () => {
  if (route.query.topicId) {
    try {
      const res = await getDebateDetail(route.query.topicId)
      if (res.code === 200) {
        mockTopic.value = res.data
      }
    } catch (err) {
      console.error('加载辩论详情失败:', err)
    }
  }
  refreshSpeeches()
})
</script>

<style scoped>
.debate-flow {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: var(--color-text);
  font-size: 24px;
}

.step {
  margin-bottom: 30px;
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid var(--color-primary);
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin-bottom: 15px;
}

.refresh-btn {
  width: 100%;
  margin-top: 15px;
  padding: 12px 20px;
  background: var(--color-primary);
  color: var(--color-text-on-primary, #fff);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border: none;
  transition: all 0.3s;
}

.refresh-btn:hover {
  opacity: 0.9;
}

/* 模板辩论样式 */
.round-speech-input {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.round-speech-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
}

.remaining-time {
  color: var(--color-primary);
}

.round-speech-input textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.speech-actions {
  margin-top: 16px;
  text-align: right;
}

.speech-actions button {
  padding: 10px 30px;
  background: var(--color-primary);
  color: var(--color-text-on-primary, #fff);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.speech-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.waiting-hint {
  padding: 40px;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 14px;
}

.round-complete {
  padding: 40px;
  text-align: center;
  color: var(--color-success);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 14px;
}

.round-progress {
  margin-bottom: 30px;
}

.progress-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 16px;
}

.progress-steps {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  padding: 12px 8px;
  border-radius: 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
}

.progress-step.done {
  border-color: var(--color-success);
}

.progress-step.active {
  border-color: var(--color-primary);
  background: rgba(74, 144, 226, 0.08);
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border);
}

.progress-step.done .step-dot {
  background: var(--color-success);
}

.progress-step.active .step-dot {
  background: var(--color-primary);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.step-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-align: center;
}

.step-speaker {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

@media (max-width: 768px) {
  .debate-flow {
    padding: 15px;
  }

  h2 {
    font-size: 20px;
  }

  .progress-steps {
    gap: 4px;
  }

  .progress-step {
    min-width: 60px;
    padding: 8px 4px;
  }
}
</style>
