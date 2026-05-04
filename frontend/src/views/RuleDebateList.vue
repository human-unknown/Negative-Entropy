<template>
  <div class="rule-debate-page">
    <div class="page-header">
      <h1>规则修改辩论</h1>
      <p class="subtitle">
        所有社区成员均可参与规则修改的讨论与表决
      </p>
    </div>

    <div class="action-bar">
      <button
        class="btn-history"
        @click="$router.push('/rules/history')"
      >
        📜 查看修改历史
      </button>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      加载中...
    </div>

    <div
      v-else-if="debates.length === 0"
      class="empty"
    >
      <p>暂无活跃的规则辩论</p>
    </div>

    <div
      v-else
      class="debate-list"
    >
      <div
        v-for="debate in debates"
        :key="debate.id"
        class="debate-card"
        @click="$router.push(`/rules/debate/${debate.id}`)"
      >
        <div class="card-header">
          <h3>{{ debate.title }}</h3>
          <span
            class="status-tag"
            :class="debate.status"
          >
            {{ getStatusText(debate.status) }}
          </span>
        </div>
        <div class="card-meta">
          <span class="meta-item">发起人：{{ debate.initiator_name }}</span>
          <span class="meta-item">参与人数：{{ debate.participant_count || 0 }}</span>
          <span class="meta-item">{{ formatTime(debate.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const debates = ref([])
const loading = ref(false)

const statusTextMap = {
  pending: '讨论中',
  ongoing: '进行中',
  approved: '已通过',
  rejected: '已拒绝'
}

const getStatusText = (status) => statusTextMap[status] || status

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/rule-debate')
    if (res.code === 200) {
      debates.value = res.data
    }
  } catch (err) {
    console.error('加载规则辩论列表失败:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.rule-debate-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  margin: 0 0 8px;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.action-bar {
  margin-bottom: 24px;
}

.btn-history {
  padding: 10px 20px;
  background: #4a90e2;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-history:hover {
  background: #357abd;
}

.loading, .empty {
  text-align: center;
  padding: 60px;
  color: #999;
}

.debate-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.debate-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.debate-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status-tag.pending, .status-tag.ongoing {
  background: #e3f2fd;
  color: #1976d2;
}

.status-tag.approved {
  background: #e8f5e9;
  color: #388e3c;
}

.status-tag.rejected {
  background: #ffebee;
  color: #d32f2f;
}

.card-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
}
</style>
