<template>
  <div class="punishment-history">
    <div class="history-header">
      <h2 class="history-title">处罚记录</h2>
    </div>

    <div class="history-content">
      <div v-if="loading" class="loading-state">加载中...</div>
      
      <div v-else-if="punishments.length === 0" class="empty-state">
        <p>暂无处罚记录</p>
      </div>

      <div v-else class="punishment-list">
        <div v-for="item in punishments" :key="item.id" class="punishment-item">
          <div class="punishment-header">
            <span class="punishment-type" :class="`type-${item.type}`">
              {{ getTypeText(item.type) }}
            </span>
            <span class="punishment-time">{{ formatTime(item.created_at) }}</span>
          </div>
          <div class="punishment-reason">{{ item.reason }}</div>
          <div v-if="item.duration" class="punishment-duration">
            处罚时长：{{ item.duration }}天
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const loading = ref(false);
const punishments = ref([]);

const fetchPunishments = async () => {
  loading.value = true;
  try {
    const data = await request.get('/user/punishments');
    punishments.value = data.punishments || [];
  } catch (err) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

const getTypeText = (type) => {
  const typeMap = {
    warning: '警告',
    mute: '禁言',
    ban: '封号'
  };
  return typeMap[type] || '未知';
};

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  fetchPunishments();
});
</script>

<style scoped>
.punishment-history {
  max-width: 1000px;
  margin: 0 auto;
}

.history-header {
  margin-bottom: 2rem;
}

.history-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.history-content {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 2rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 0;
  color: #666;
  font-size: 0.9375rem;
}

.punishment-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.punishment-item {
  padding: 1.25rem;
  border: 1px solid #e0e0e0;
  border-left: 4px solid #f44336;
  border-radius: 4px;
  background-color: #fff;
}

.punishment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.punishment-type {
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.type-warning {
  background-color: #fff3e0;
  color: #e65100;
}

.type-mute {
  background-color: #ffebee;
  color: #c62828;
}

.type-ban {
  background-color: #f3e5f5;
  color: #6a1b9a;
}

.punishment-time {
  font-size: 0.8125rem;
  color: #999;
}

.punishment-reason {
  font-size: 0.9375rem;
  color: #333;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.punishment-duration {
  font-size: 0.875rem;
  color: #666;
}

@media (max-width: 768px) {
  .history-content {
    padding: 1.5rem;
  }

  .history-title {
    font-size: 1.25rem;
  }

  .punishment-item {
    padding: 1rem;
  }

  .punishment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .punishment-reason {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .history-content {
    padding: 1rem;
  }

  .punishment-item {
    padding: 0.875rem;
  }
}
</style>
