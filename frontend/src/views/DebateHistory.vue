<template>
  <div class="debate-history">
    <div class="history-header">
      <h2 class="history-title">辩论历史</h2>
    </div>

    <div class="history-content">
      <div v-if="loading" class="loading-state">加载中...</div>
      
      <div v-else-if="debates.length === 0" class="empty-state">
        <p>暂无辩论记录</p>
      </div>

      <div v-else class="debate-list">
        <div v-for="debate in debates" :key="debate.id" class="debate-item">
          <div class="debate-main">
            <h3 class="debate-title">{{ debate.title }}</h3>
            <div class="debate-meta">
              <span class="meta-item stance" :class="`stance-${debate.stance}`">
                {{ debate.stance === 'for' ? '正方' : '反方' }}
              </span>
              <span class="meta-item result" :class="getResultClass(debate)">
                {{ getResultText(debate) }}
              </span>
              <span class="meta-item time">{{ formatTime(debate.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="total > limit" class="pagination">
        <button 
          class="page-btn" 
          :disabled="page === 1"
          @click="changePage(page - 1)"
        >
          上一页
        </button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button 
          class="page-btn" 
          :disabled="page >= totalPages"
          @click="changePage(page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const debates = ref([]);
const loading = ref(false);
const page = ref(1);
const limit = ref(10);
const total = ref(0);

const totalPages = computed(() => Math.ceil(total.value / limit.value));

const fetchDebates = async () => {
  loading.value = true;
  try {
    const data = await request.get('/user/debates', { params: { page: page.value, limit: limit.value } });
    debates.value = data.debates;
    total.value = data.total;
  } catch (err) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

const changePage = (newPage) => {
  page.value = newPage;
  fetchDebates();
};

const getResultClass = (debate) => {
  if (!debate.winner_stance) return 'result-pending';
  return debate.winner_stance === debate.stance ? 'result-win' : 'result-lose';
};

const getResultText = (debate) => {
  if (!debate.winner_stance) return '进行中';
  return debate.winner_stance === debate.stance ? '胜利' : '失败';
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
  fetchDebates();
});
</script>

<style scoped>
.debate-history {
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

.debate-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.debate-item {
  padding: 1.25rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: box-shadow 0.2s;
}

.debate-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.debate-main {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.debate-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: #1a1a1a;
}

.debate-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.stance {
  font-weight: 500;
}

.stance-for {
  background-color: #e3f2fd;
  color: #1976d2;
}

.stance-against {
  background-color: #fce4ec;
  color: #c2185b;
}

.result {
  font-weight: 500;
}

.result-win {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.result-lose {
  background-color: #ffebee;
  color: #c62828;
}

.result-pending {
  background-color: #fff3e0;
  color: #e65100;
}

.time {
  color: #666;
  background-color: #f5f5f5;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.page-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #333;
  background-color: #fff;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #f5f5f5;
  border-color: #1976d2;
  color: #1976d2;
}

.page-btn:disabled {
  color: #bdbdbd;
  cursor: not-allowed;
}

.page-info {
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

  .debate-item {
    padding: 1rem;
  }

  .debate-title {
    font-size: 0.9375rem;
  }

  .debate-meta {
    gap: 0.5rem;
  }

  .meta-item {
    font-size: 0.8125rem;
    padding: 0.2rem 0.5rem;
  }
}

@media (max-width: 480px) {
  .history-content {
    padding: 1rem;
  }

  .debate-item {
    padding: 0.875rem;
  }

  .pagination {
    gap: 0.5rem;
  }

  .page-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.8125rem;
  }
}
</style>
