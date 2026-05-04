<template>
  <div class="rule-debate-detail">
    <div class="back-link">
      <button @click="$router.push('/rules')">
        ← 返回列表
      </button>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      加载中...
    </div>

    <template v-else-if="debate">
      <div class="detail-header">
        <h1>{{ debate.title }}</h1>
        <span
          class="status-tag"
          :class="debate.status"
        >
          {{ getStatusText(debate.status) }}
        </span>
      </div>

      <div class="detail-meta">
        <span>发起人：{{ debate.initiator_name }}</span>
        <span>支持 {{ debate.supportCount }} / 反对 {{ debate.opposeCount }}</span>
        <span>{{ formatTime(debate.created_at) }}</span>
      </div>

      <div class="section">
        <h2>现状</h2>
        <p class="content-box">
          {{ debate.current_status }}
        </p>
      </div>

      <div class="section">
        <h2>修改提案</h2>
        <p class="content-box proposal">
          {{ debate.modify_content }}
        </p>
      </div>

      <div class="section">
        <h2>各方发言</h2>
        <RuleDebateSpeeches :speeches="speeches" />
        <button
          class="refresh-btn"
          @click="loadSpeeches"
        >
          🔄 刷新发言
        </button>
      </div>
    </template>

    <div
      v-else-if="!loading"
      class="empty"
    >
      辩论不存在
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/api/request'
import RuleDebateSpeeches from '@/components/RuleDebateSpeeches.vue'

const route = useRoute()
const debate = ref(null)
const speeches = ref([])
const loading = ref(false)

const statusTextMap = {
  pending: '讨论中',
  ongoing: '进行中',
  approved: '已通过',
  rejected: '已拒绝'
}

const getStatusText = (status) => statusTextMap[status] || status
const formatTime = (time) => new Date(time).toLocaleString('zh-CN')

const loadDebate = async () => {
  try {
    const res = await request.get(`/rule-debate/${route.params.id}`)
    if (res.code === 200) {
      debate.value = res.data
    }
  } catch (err) {
    console.error('加载规则辩论详情失败:', err)
  }
}

const loadSpeeches = async () => {
  try {
    const res = await request.get(`/rule-debate/${route.params.id}/speeches`)
    if (res.code === 200) {
      speeches.value = res.data
    }
  } catch (err) {
    console.error('加载发言失败:', err)
  }
}

onMounted(async () => {
  loading.value = true
  await loadDebate()
  await loadSpeeches()
  loading.value = false
})
</script>

<style scoped>
.rule-debate-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
}

.back-link {
  margin-bottom: 20px;
}

.back-link button {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.detail-header h1 {
  margin: 0;
  font-size: 24px;
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
.status-tag.approved { background: #e8f5e9; color: #388e3c; }
.status-tag.rejected { background: #ffebee; color: #d32f2f; }

.detail-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #666;
}

.section {
  margin-bottom: 28px;
}

.section h2 {
  font-size: 18px;
  margin: 0 0 12px;
  color: #333;
  padding-left: 10px;
  border-left: 3px solid #4a90e2;
}

.content-box {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  line-height: 1.8;
  color: #555;
  white-space: pre-wrap;
}

.content-box.proposal {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.refresh-btn {
  width: 100%;
  margin-top: 16px;
  padding: 10px;
  background: #4a90e2;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.loading, .empty {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>
