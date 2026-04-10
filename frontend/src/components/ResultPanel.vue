<template>
  <div class="result-panel">
    <div class="result-header">
      <h2>🏆 辩论结果</h2>
    </div>

    <div v-if="result.winner" class="winner-section">
      <div :class="['winner-badge', result.winner === 1 ? 'pro' : 'con']">
        <div class="trophy">🏆</div>
        <div class="winner-text">{{ result.winner === 1 ? '正方' : '反方' }}获胜</div>
      </div>
      <div class="vote-stats">
        <div class="stat-item pro">
          <span class="label">正方票数</span>
          <span class="count">{{ result.pro_votes }}</span>
        </div>
        <div class="vs">VS</div>
        <div class="stat-item con">
          <span class="label">反方票数</span>
          <span class="count">{{ result.con_votes }}</span>
        </div>
      </div>
    </div>

    <div v-else class="tie-section">
      <div class="tie-icon">⚖️</div>
      <h3>平票</h3>
      <p>正方 {{ result.pro_votes }} : {{ result.con_votes }} 反方</p>
      <div class="admin-review">
        <span class="review-icon">👨‍⚖️</span>
        <span>等待管理员评审</span>
      </div>
    </div>

    <div v-if="result.summary" class="summary-section">
      <h3>📝 核心观点总结</h3>
      <p class="summary-text">{{ result.summary }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  result: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.result-panel {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 30px;
}

.result-header h2 {
  text-align: center;
  color: var(--color-text);
  margin-bottom: 30px;
}

.winner-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
}

.winner-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 30px 50px;
  border-radius: 16px;
}

.winner-badge.pro {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.2), rgba(74, 144, 226, 0.05));
  border: 2px solid var(--color-primary);
}

.winner-badge.con {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.2), rgba(231, 76, 60, 0.05));
  border: 2px solid var(--color-danger);
}

.trophy {
  font-size: 60px;
}

.winner-text {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
}

.vote-stats {
  display: flex;
  align-items: center;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.count {
  font-size: 32px;
  font-weight: 700;
}

.stat-item.pro .count {
  color: var(--color-primary);
}

.stat-item.con .count {
  color: var(--color-danger);
}

.vs {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.tie-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 30px;
}

.tie-icon {
  font-size: 60px;
}

.tie-section h3 {
  font-size: 24px;
  color: var(--color-text);
  margin: 0;
}

.tie-section p {
  font-size: 18px;
  color: var(--color-text-secondary);
  margin: 0;
}

.admin-review {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: rgba(243, 156, 18, 0.1);
  border: 1px solid var(--color-warning);
  border-radius: 8px;
  color: var(--color-warning);
  font-size: 14px;
  margin-top: 10px;
}

.review-icon {
  font-size: 20px;
}

.summary-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid var(--color-border);
}

.summary-section h3 {
  color: var(--color-text);
  margin-bottom: 15px;
  font-size: 18px;
}

.summary-text {
  color: var(--color-text-secondary);
  line-height: 1.8;
  font-size: 14px;
}

@media (max-width: 768px) {
  .result-panel {
    padding: 20px;
  }

  .winner-badge {
    padding: 25px 40px;
  }

  .trophy {
    font-size: 50px;
  }

  .winner-text {
    font-size: 24px;
  }

  .vote-stats {
    gap: 20px;
  }

  .count {
    font-size: 28px;
  }

  .tie-icon {
    font-size: 50px;
  }

  .tie-section h3 {
    font-size: 20px;
  }
}
</style>
