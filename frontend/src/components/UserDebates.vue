<template>
  <div class="user-debates">
    <h3 class="section-title">我的辩论</h3>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="debates.length === 0" class="empty">暂无辩论记录</div>

    <div v-else class="debate-list">
      <div v-for="item in debates" :key="item.id" class="debate-item">
        <div class="debate-info">
          <div class="debate-title">{{ item.title }}</div>
          <div class="debate-meta">
            <span :class="['status-tag', `status-${item.status}`]">
              {{ statusLabels[item.status] || '未知' }}
            </span>
            <span class="stance-tag" :class="item.stance === 1 ? 'pro' : 'con'">
              {{ item.stance === 1 ? '正方' : '反方' }}
            </span>
            <span v-if="item.winner === 'pro'" class="winner-tag">正方胜</span>
            <span v-else-if="item.winner === 'con'" class="winner-tag">反方胜</span>
            <span class="debate-time">{{ formatTime(item.created_at) }}</span>
          </div>
        </div>
        <button class="view-btn" @click="goToDebate(item.id)">查看</button>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page === 1" @click="changePage(page - 1)">上一页</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'

const router = useRouter()
const debates = ref([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const limit = 10

const statusLabels = { 0: '待开始', 1: '进行中', 2: '已结束' }
const totalPages = computed(() => Math.ceil(total.value / limit))

const loadDebates = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/user/debates', { params: { page: page.value, limit } })
    if (res.code === 200) {
      debates.value = res.data.debates
      total.value = res.data.total
    }
  } catch (err) {
    console.error('获取辩论历史失败', err)
  } finally {
    loading.value = false
  }
}

const changePage = (newPage) => { page.value = newPage; loadDebates() }
const goToDebate = (id) => { router.push(`/debates/flow?topicId=${id}`) }
const formatTime = (time) => {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

onMounted(loadDebates)
</script>

<style scoped>
.user-debates {
  max-width: 800px;
}

.section-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.loading, .empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.debate-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.debate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9f9f9;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.debate-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.debate-info {
  flex: 1;
  min-width: 0;
}

.debate-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.debate-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-tag, .stance-tag, .winner-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-0 { background: #fff3e0; color: #e65100; }
.status-1 { background: #e8f5e9; color: #2e7d32; }
.status-2 { background: #f5f5f5; color: #757575; }

.stance-tag.pro { background: #e3f2fd; color: #1565c0; }
.stance-tag.con { background: #fce4ec; color: #c62828; }

.winner-tag { background: #fff8e1; color: #f9a825; }

.debate-time {
  font-size: 12px;
  color: #999;
}

.view-btn {
  flex-shrink: 0;
  padding: 8px 20px;
  margin-left: 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.view-btn:hover { background: #66b1ff; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.pagination button {
  padding: 8px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.pagination button:disabled { background: #ddd; cursor: not-allowed; }
.page-info { font-size: 13px; color: #666; }
</style>
