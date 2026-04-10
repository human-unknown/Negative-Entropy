<template>
  <div class="user-info">
    <div class="avatar-section">
      <div class="avatar-placeholder"></div>
    </div>

    <div class="info-section">
      <div class="info-row">
        <span class="label">用户名</span>
        <span class="value">{{ username }}</span>
      </div>

      <div class="info-row">
        <span class="label">等级</span>
        <span class="value level">Lv.{{ level }}</span>
      </div>

      <div class="info-row exp-row">
        <span class="label">经验值</span>
        <div class="exp-bar">
          <div class="exp-progress" :style="{ width: expPercent + '%' }"></div>
          <span class="exp-text">{{ currentExp }} / {{ maxExp }}</span>
        </div>
      </div>

      <div class="info-row">
        <span class="label">注册时间</span>
        <span class="value">{{ registerTime }}</span>
      </div>

      <div class="info-row">
        <span class="label">状态</span>
        <span class="value status" :class="statusClass">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  username: { type: String, default: '用户名' },
  level: { type: Number, default: 1 },
  currentExp: { type: Number, default: 0 },
  maxExp: { type: Number, default: 100 },
  registerTime: { type: String, default: '2024-01-01' },
  status: { type: String, default: 'normal' }
});

const expPercent = computed(() => {
  return Math.min((props.currentExp / props.maxExp) * 100, 100);
});

const statusClass = computed(() => {
  return `status-${props.status}`;
});

const statusText = computed(() => {
  const statusMap = {
    normal: '正常',
    banned: '封禁',
    warning: '警告'
  };
  return statusMap[props.status] || '正常';
});
</script>

<style scoped>
.user-info {
  display: flex;
  gap: 2rem;
  padding: 1.5rem;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.avatar-section {
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  background-color: #e0e0e0;
  border-radius: 50%;
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.exp-row {
  align-items: flex-start;
}

.label {
  width: 80px;
  font-size: 0.875rem;
  color: #666;
  flex-shrink: 0;
}

.value {
  font-size: 0.9375rem;
  color: #1a1a1a;
  font-weight: 500;
}

.level {
  color: #1976d2;
}

.exp-bar {
  flex: 1;
  position: relative;
  height: 24px;
  background-color: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
}

.exp-progress {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #1976d2, #42a5f5);
  transition: width 0.3s ease;
}

.exp-text {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 0.75rem;
  color: #333;
  font-weight: 500;
  z-index: 1;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-normal {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-warning {
  background-color: #fff3e0;
  color: #e65100;
}

.status-banned {
  background-color: #ffebee;
  color: #c62828;
}

@media (max-width: 768px) {
  .user-info {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
  }

  .avatar-placeholder {
    width: 100px;
    height: 100px;
  }

  .label {
    width: 70px;
    font-size: 0.8125rem;
  }

  .value {
    font-size: 0.875rem;
  }

  .exp-text {
    font-size: 0.6875rem;
  }
}

@media (max-width: 480px) {
  .avatar-placeholder {
    width: 80px;
    height: 80px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .exp-row {
    align-items: flex-start;
  }

  .label {
    width: auto;
  }

  .exp-bar {
    width: 100%;
  }
}
</style>
