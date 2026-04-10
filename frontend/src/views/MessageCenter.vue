<template>
  <div class="message-center">
    <div class="message-header">
      <h2 class="message-title">消息中心</h2>
      <button class="mark-all-btn" @click="markAllRead">全部标记已读</button>
    </div>

    <div class="message-content">
      <div v-if="loading" class="loading-state">加载中...</div>
      
      <div v-else-if="messages.length === 0" class="empty-state">
        <p>暂无消息</p>
      </div>

      <div v-else class="message-list">
        <div 
          v-for="msg in messages" 
          :key="msg.id" 
          class="message-item"
          :class="{ unread: !msg.is_read }"
          @click="markRead(msg)"
        >
          <div class="message-icon" :class="`icon-${msg.type}`"></div>
          <div class="message-main">
            <div class="message-top">
              <span class="message-type">{{ getTypeText(msg.type) }}</span>
              <span class="message-time">{{ formatTime(msg.created_at) }}</span>
            </div>
            <div class="message-text">{{ msg.content }}</div>
          </div>
          <div v-if="!msg.is_read" class="unread-dot"></div>
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
const messages = ref([]);

const fetchMessages = async () => {
  loading.value = true;
  try {
    const data = await request.get('/user/messages');
    messages.value = data.messages || [];
  } catch (err) {
    ElMessage.error('加载消息失败');
  } finally {
    loading.value = false;
  }
};

const markRead = async (msg) => {
  if (msg.is_read) return;
  
  try {
    await request.post(`/user/messages/${msg.id}/read`);
    msg.is_read = true;
  } catch (err) {
    ElMessage.error('标记失败');
  }
};

const markAllRead = async () => {
  try {
    await request.post('/user/messages/read-all');
    messages.value.forEach(msg => msg.is_read = true);
    ElMessage.success('已全部标记为已读');
  } catch (err) {
    ElMessage.error('操作失败');
  }
};

const getTypeText = (type) => {
  const typeMap = {
    audit: '审核结果',
    debate: '辩论提醒',
    violation: '违规提醒',
    rule: '规则更新'
  };
  return typeMap[type] || '系统消息';
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
  fetchMessages();
});
</script>

<style scoped>
.message-center {
  max-width: 1000px;
  margin: 0 auto;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.message-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.mark-all-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #1976d2;
  background-color: #fff;
  border: 1px solid #1976d2;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.mark-all-btn:hover {
  background-color: #1976d2;
  color: #fff;
}

.message-content {
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

.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.message-item:hover {
  background-color: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-item.unread {
  background-color: #f0f7ff;
  border-color: #1976d2;
}

.message-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.icon-audit {
  background-color: #e3f2fd;
}

.icon-debate {
  background-color: #fff3e0;
}

.icon-violation {
  background-color: #ffebee;
}

.icon-rule {
  background-color: #f3e5f5;
}

.message-main {
  flex: 1;
  min-width: 0;
}

.message-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 1rem;
}

.message-type {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1976d2;
}

.message-time {
  font-size: 0.8125rem;
  color: #999;
  flex-shrink: 0;
}

.message-text {
  font-size: 0.9375rem;
  color: #333;
  line-height: 1.5;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background-color: #f44336;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .message-title {
    font-size: 1.25rem;
  }

  .mark-all-btn {
    width: 100%;
  }

  .message-content {
    padding: 1.5rem;
  }

  .message-item {
    padding: 0.875rem;
  }

  .message-icon {
    width: 32px;
    height: 32px;
  }

  .message-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .message-text {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .message-content {
    padding: 1rem;
  }

  .message-item {
    gap: 0.75rem;
  }
}
</style>
