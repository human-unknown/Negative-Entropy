<template>
  <div class="user-activity">
    <div class="activity-header">
      <h2 class="activity-title">我的发言与投票</h2>
      <div class="tab-switch">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'speeches' }"
          @click="activeTab = 'speeches'"
        >
          我的发言
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'votes' }"
          @click="activeTab = 'votes'"
        >
          投票记录
        </button>
      </div>
    </div>

    <div class="activity-content">
      <!-- 发言列表 -->
      <div v-if="activeTab === 'speeches'" class="speeches-section">
        <div v-if="loading" class="loading-state">加载中...</div>
        
        <div v-else-if="speeches.length === 0" class="empty-state">
          <p>暂无发言记录</p>
        </div>

        <div v-else class="speech-list">
          <div v-for="speech in speeches" :key="speech.id" class="speech-item">
            <div class="speech-header">
              <span class="debate-title">{{ speech.debate_title }}</span>
              <span class="audit-status" :class="`status-${speech.audit_status}`">
                {{ getAuditStatusText(speech.audit_status) }}
              </span>
            </div>
            <div class="speech-content">{{ speech.content }}</div>
            <div class="speech-footer">
              <span class="speech-time">{{ formatTime(speech.created_at) }}</span>
              <span v-if="speech.audit_reason" class="audit-reason">
                原因：{{ speech.audit_reason }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 投票列表 -->
      <div v-if="activeTab === 'votes'" class="votes-section">
        <div v-if="loading" class="loading-state">加载中...</div>
        
        <div v-else-if="votes.length === 0" class="empty-state">
          <p>暂无投票记录</p>
        </div>

        <div v-else class="vote-list">
          <div v-for="vote in votes" :key="vote.id" class="vote-item">
            <div class="vote-header">
              <span class="debate-title">{{ vote.debate_title }}</span>
              <span class="vote-stance" :class="`stance-${vote.stance}`">
                投给{{ vote.stance === 'for' ? '正方' : '反方' }}
              </span>
            </div>
            <div class="vote-footer">
              <span class="vote-time">{{ formatTime(vote.created_at) }}</span>
            </div>
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

const activeTab = ref('speeches');
const loading = ref(false);
const speeches = ref([]);
const votes = ref([]);

const fetchSpeeches = async () => {
  loading.value = true;
  try {
    const data = await request.get('/user/speeches');
    speeches.value = data.speeches || [];
  } catch (err) {
    ElMessage.error('加载发言失败');
  } finally {
    loading.value = false;
  }
};

const fetchVotes = async () => {
  loading.value = true;
  try {
    const data = await request.get('/user/votes');
    votes.value = data.votes || [];
  } catch (err) {
    ElMessage.error('加载投票失败');
  } finally {
    loading.value = false;
  }
};

const getAuditStatusText = (status) => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return statusMap[status] || '未知';
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
  fetchSpeeches();
});
</script>

<style scoped>
.user-activity {
  max-width: 1000px;
  margin: 0 auto;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.activity-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.tab-switch {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1.25rem;
  font-size: 0.9375rem;
  color: #666;
  background-color: #fff;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #1976d2;
  color: #1976d2;
}

.tab-btn.active {
  background-color: #1976d2;
  border-color: #1976d2;
  color: #fff;
}

.activity-content {
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

.speech-list,
.vote-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.speech-item,
.vote-item {
  padding: 1.25rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: box-shadow 0.2s;
}

.speech-item:hover,
.vote-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.speech-header,
.vote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.debate-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1a1a1a;
  flex: 1;
}

.audit-status {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
}

.status-pending {
  background-color: #fff3e0;
  color: #e65100;
}

.status-approved {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-rejected {
  background-color: #ffebee;
  color: #c62828;
}

.speech-content {
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 0.9375rem;
  color: #333;
  line-height: 1.6;
  margin-bottom: 0.75rem;
}

.speech-footer,
.vote-footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: #666;
}

.speech-time,
.vote-time {
  color: #999;
}

.audit-reason {
  color: #d32f2f;
}

.vote-stance {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
}

.stance-for {
  background-color: #e3f2fd;
  color: #1976d2;
}

.stance-against {
  background-color: #fce4ec;
  color: #c2185b;
}

@media (max-width: 768px) {
  .activity-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .activity-title {
    font-size: 1.25rem;
  }

  .tab-switch {
    width: 100%;
  }

  .tab-btn {
    flex: 1;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  .activity-content {
    padding: 1.5rem;
  }

  .speech-item,
  .vote-item {
    padding: 1rem;
  }

  .speech-header,
  .vote-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .debate-title {
    font-size: 0.875rem;
  }

  .speech-content {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .activity-content {
    padding: 1rem;
  }

  .speech-item,
  .vote-item {
    padding: 0.875rem;
  }

  .speech-footer,
  .vote-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
