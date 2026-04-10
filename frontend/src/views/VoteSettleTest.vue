<template>
  <div class="vote-settle-test">
    <h2>🗳️ 投票结算流程测试</h2>
    
    <div class="flow-steps">
      <div :class="['step-item', { active: currentStep >= 1, done: currentStep > 1 }]">
        <div class="step-num">1</div>
        <div class="step-label">辩论结束</div>
      </div>
      <div class="step-line"></div>
      <div :class="['step-item', { active: currentStep >= 2, done: currentStep > 2 }]">
        <div class="step-num">2</div>
        <div class="step-label">暗投</div>
      </div>
      <div class="step-line"></div>
      <div :class="['step-item', { active: currentStep >= 3, done: currentStep > 3 }]">
        <div class="step-num">3</div>
        <div class="step-label">票数统计</div>
      </div>
      <div class="step-line"></div>
      <div :class="['step-item', { active: currentStep >= 4, done: currentStep > 4 }]">
        <div class="step-num">4</div>
        <div class="step-label">胜负判定</div>
      </div>
      <div class="step-line"></div>
      <div :class="['step-item', { active: currentStep >= 5 }]">
        <div class="step-num">5</div>
        <div class="step-label">结果展示</div>
      </div>
    </div>

    <!-- 步骤1: 结束辩论 -->
    <div v-if="currentStep === 1" class="test-section">
      <h3>步骤1: 结束辩论</h3>
      <div class="topic-info">
        <p><strong>话题ID:</strong> {{ topicId }}</p>
        <p><strong>状态:</strong> {{ getStatusText(topicStatus) }}</p>
      </div>
      <button @click="closeTopic" :disabled="loading" class="action-btn">
        {{ loading ? '处理中...' : '结束辩论' }}
      </button>
    </div>

    <!-- 步骤2: 投票 -->
    <div v-if="currentStep === 2" class="test-section">
      <h3>步骤2: 暗投环节</h3>
      <VotePanel 
        :topic="{ id: topicId, title: '测试话题' }"
        :hasVoted="hasVoted"
        @voted="handleVoted"
      />
      <div class="vote-stats">
        <p>💡 提示：投票结果不公开，仅用于统计</p>
        <button @click="currentStep = 3" class="action-btn secondary">
          跳过投票（测试用）
        </button>
      </div>
    </div>

    <!-- 步骤3: 票数统计 -->
    <div v-if="currentStep === 3" class="test-section">
      <h3>步骤3: 票数统计</h3>
      <div class="stats-info">
        <p>正在统计投票结果...</p>
        <div class="vote-count">
          <div class="count-item pro">
            <span class="label">正方票数</span>
            <span class="value">{{ voteStats.proVotes }}</span>
          </div>
          <div class="count-item con">
            <span class="label">反方票数</span>
            <span class="value">{{ voteStats.conVotes }}</span>
          </div>
        </div>
      </div>
      <button @click="settleTopic" :disabled="loading" class="action-btn">
        {{ loading ? '结算中...' : '执行结算' }}
      </button>
    </div>

    <!-- 步骤4: 胜负判定 -->
    <div v-if="currentStep === 4" class="test-section">
      <h3>步骤4: 胜负判定</h3>
      <div class="result-preview">
        <div v-if="result.winner" class="winner-info">
          <div class="winner-badge">
            🏆 {{ result.winner === 1 ? '正方' : '反方' }}获胜
          </div>
          <p>票数: {{ result.winner === 1 ? result.pro_votes : result.con_votes }} : {{ result.winner === 1 ? result.con_votes : result.pro_votes }}</p>
        </div>
        <div v-else class="tie-info">
          <div class="tie-badge">⚖️ 平票</div>
          <p>正方 {{ result.pro_votes }} : {{ result.con_votes }} 反方</p>
          <p class="admin-tip">等待管理员评审</p>
        </div>
      </div>
      <button @click="currentStep = 5" class="action-btn">
        查看结果展示
      </button>
    </div>

    <!-- 步骤5: 结果展示 -->
    <div v-if="currentStep === 5" class="test-section">
      <h3>步骤5: 结果展示</h3>
      <ResultPanel :result="result" />
      <button @click="resetTest" class="action-btn secondary">
        重新测试
      </button>
    </div>

    <!-- 调试信息 -->
    <div class="debug-panel">
      <h4>📊 调试信息</h4>
      <div class="debug-grid">
        <div class="debug-item">
          <span class="label">话题ID:</span>
          <span class="value">{{ topicId }}</span>
        </div>
        <div class="debug-item">
          <span class="label">当前步骤:</span>
          <span class="value">{{ currentStep }}</span>
        </div>
        <div class="debug-item">
          <span class="label">话题状态:</span>
          <span class="value">{{ topicStatus }}</span>
        </div>
        <div class="debug-item">
          <span class="label">已投票:</span>
          <span class="value">{{ hasVoted ? '是' : '否' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import VotePanel from '@/components/VotePanel.vue'
import ResultPanel from '@/components/ResultPanel.vue'
import { closeDebate, voteDebate, settleDebate } from '@/api/debate'

const topicId = ref(1)
const currentStep = ref(1)
const topicStatus = ref(1)
const hasVoted = ref(false)
const loading = ref(false)

const voteStats = ref({
  proVotes: 0,
  conVotes: 0
})

const result = ref({
  pro_votes: 0,
  con_votes: 0,
  winner: null,
  summary: ''
})

const getStatusText = (status) => {
  const map = { 0: '待开始', 1: '进行中', 2: '已结束', 3: '已结算' }
  return map[status] || '未知'
}

const closeTopic = async () => {
  loading.value = true
  try {
    await closeDebate(topicId.value)
    topicStatus.value = 2
    currentStep.value = 2
    ElMessage.success('辩论已结束，进入投票环节')
  } catch (err) {
    ElMessage.error(err.message || '结束失败')
  } finally {
    loading.value = false
  }
}

const handleVoted = (stance) => {
  hasVoted.value = true
  if (stance === 1) voteStats.value.proVotes++
  else voteStats.value.conVotes++
  
  setTimeout(() => {
    currentStep.value = 3
    ElMessage.success('投票成功，进入统计环节')
  }, 1000)
}

const settleTopic = async () => {
  loading.value = true
  try {
    const res = await settleDebate(topicId.value)
    result.value = res.data
    voteStats.value.proVotes = res.data.pro_votes
    voteStats.value.conVotes = res.data.con_votes
    currentStep.value = 4
    ElMessage.success('结算完成')
  } catch (err) {
    ElMessage.error(err.message || '结算失败')
  } finally {
    loading.value = false
  }
}

const resetTest = () => {
  currentStep.value = 1
  topicStatus.value = 1
  hasVoted.value = false
  voteStats.value = { proVotes: 0, conVotes: 0 }
  result.value = { pro_votes: 0, con_votes: 0, winner: null, summary: '' }
  ElMessage.info('测试已重置')
}
</script>

<style scoped>
.vote-settle-test {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  text-align: center;
  color: var(--color-text);
  margin-bottom: 40px;
}

.flow-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  padding: 20px;
  background: var(--color-bg-secondary);
  border-radius: 12px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.4;
  transition: all 0.3s;
}

.step-item.active {
  opacity: 1;
}

.step-item.done .step-num {
  background: #27ae60;
}

.step-num {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #fff;
  transition: all 0.3s;
}

.step-item.active .step-num {
  background: var(--color-primary);
  transform: scale(1.1);
}

.step-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.step-line {
  width: 60px;
  height: 2px;
  background: var(--color-border);
  margin: 0 10px;
}

.test-section {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
}

.test-section h3 {
  color: var(--color-text);
  margin-bottom: 20px;
  font-size: 18px;
}

.topic-info, .stats-info {
  margin-bottom: 20px;
}

.topic-info p, .stats-info p {
  color: var(--color-text-secondary);
  margin: 8px 0;
}

.vote-count {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin: 20px 0;
}

.count-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.count-item .label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.count-item .value {
  font-size: 32px;
  font-weight: 700;
}

.count-item.pro .value {
  color: var(--color-primary);
}

.count-item.con .value {
  color: var(--color-danger);
}

.result-preview {
  text-align: center;
  padding: 20px;
}

.winner-badge, .tie-badge {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 15px;
  color: var(--color-text);
}

.admin-tip {
  color: var(--color-warning);
  font-size: 14px;
  margin-top: 10px;
}

.action-btn {
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.secondary {
  background: var(--color-text-secondary);
  margin-top: 10px;
}

.vote-stats {
  margin-top: 20px;
  text-align: center;
}

.vote-stats p {
  color: var(--color-warning);
  margin-bottom: 15px;
}

.debug-panel {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
}

.debug-panel h4 {
  color: var(--color-text);
  margin-bottom: 15px;
  font-size: 16px;
}

.debug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.debug-item .label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.debug-item .value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

@media (max-width: 768px) {
  .flow-steps {
    overflow-x: auto;
    justify-content: flex-start;
  }

  .step-line {
    width: 40px;
  }

  .test-section {
    padding: 20px;
  }

  .vote-count {
    gap: 20px;
  }

  .debug-grid {
    grid-template-columns: 1fr;
  }
}
</style>
