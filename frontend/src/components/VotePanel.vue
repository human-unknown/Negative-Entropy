<template>
  <div class="vote-panel">
    <div v-if="!hasVoted" class="vote-section">
      <h3>🗳️ 投票环节</h3>
      <p class="vote-tip">辩论已结束，请投票选出你认为更有说服力的一方</p>
      <p class="secret-tip">💡 投票结果不公开，仅用于统计</p>
      
      <div class="vote-options">
        <div 
          :class="['vote-option', 'pro', { selected: selectedStance === 1 }]"
          @click="selectedStance = 1"
        >
          <div class="icon">⚔️</div>
          <div class="label">支持正方</div>
          <div class="desc">{{ topic.title }} - 正方观点</div>
        </div>

        <div 
          :class="['vote-option', 'con', { selected: selectedStance === 2 }]"
          @click="selectedStance = 2"
        >
          <div class="icon">🛡️</div>
          <div class="label">支持反方</div>
          <div class="desc">{{ topic.title }} - 反方观点</div>
        </div>
      </div>

      <button 
        class="vote-btn"
        :disabled="!selectedStance || submitting"
        @click="handleVote"
      >
        {{ submitting ? '提交中...' : '确认投票' }}
      </button>
    </div>

    <div v-else class="voted-section">
      <div class="voted-icon">✅</div>
      <h3>已投票</h3>
      <p>你已完成投票，感谢参与！</p>
      <p class="result-tip">投票结果将在结算后公布</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { voteDebate } from '@/api/debate'
import { ElMessage } from 'element-plus'

const props = defineProps({
  topic: {
    type: Object,
    required: true
  },
  hasVoted: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['voted'])

const selectedStance = ref(null)
const submitting = ref(false)

const handleVote = async () => {
  if (!selectedStance.value || submitting.value) return

  submitting.value = true
  try {
    await voteDebate(props.topic.id, selectedStance.value)
    ElMessage.success('投票成功')
    emit('voted', selectedStance.value)
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.vote-panel {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 30px;
}

.vote-section h3 {
  text-align: center;
  font-size: 20px;
  color: var(--color-text);
  margin-bottom: 15px;
}

.vote-tip {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
  font-size: 14px;
}

.secret-tip {
  text-align: center;
  color: var(--color-warning);
  margin-bottom: 25px;
  font-size: 13px;
}

.vote-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;
}

.vote-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 25px 20px;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.vote-option:hover {
  transform: translateY(-3px);
}

.vote-option.pro.selected {
  border-color: var(--color-primary);
  background: rgba(74, 144, 226, 0.1);
}

.vote-option.con.selected {
  border-color: var(--color-danger);
  background: rgba(231, 76, 60, 0.1);
}

.icon {
  font-size: 40px;
}

.label {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
}

.vote-btn {
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
}

.vote-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voted-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 40px 20px;
}

.voted-icon {
  font-size: 60px;
}

.voted-section h3 {
  font-size: 24px;
  color: var(--color-text);
  margin: 0;
}

.voted-section p {
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0;
}

.result-tip {
  color: var(--color-warning) !important;
  font-size: 13px;
}

@media (max-width: 768px) {
  .vote-panel {
    padding: 20px;
  }

  .vote-options {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .vote-option {
    padding: 20px;
  }

  .icon {
    font-size: 36px;
  }

  .label {
    font-size: 16px;
  }

  .voted-icon {
    font-size: 50px;
  }

  .voted-section h3 {
    font-size: 20px;
  }
}
</style>
