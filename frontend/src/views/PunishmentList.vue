<template>
  <div class="punishment-list">
    <h2>处罚公示</h2>
    
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else class="list">
      <div v-for="item in punishments" :key="item.id" class="item">
        <div class="user">用户 {{ maskUsername(item.username) }}</div>
        <div class="violation">{{ item.violation_type }}</div>
        <div class="punishment">{{ getPunishmentLabel(item.punishment_type) }}</div>
        <div class="time">{{ formatTime(item.created_at) }}</div>
      </div>
    </div>

    <div v-if="!loading && total > pageSize" class="pagination">
      <button @click="prevPage" :disabled="page === 1">上一页</button>
      <span>{{ page }} / {{ Math.ceil(total / pageSize) }}</span>
      <button @click="nextPage" :disabled="page >= Math.ceil(total / pageSize)">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../api/request'
import { PUNISHMENT_LABEL } from '../constants/punishment'

const punishments = ref([])
const loading = ref(true)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetchPunishments = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/punishments', {
      params: { page: page.value, pageSize: pageSize.value }
    })
    if (res.code === 200) {
      punishments.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取处罚列表失败:', error)
  } finally {
    loading.value = false
  }
}

const maskUsername = (name) => {
  if (!name || name.length <= 2) return name
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

const getPunishmentLabel = (type) => PUNISHMENT_LABEL[type] || '未知'

const formatTime = (time) => new Date(time).toLocaleDateString()

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchPunishments()
  }
}

const nextPage = () => {
  if (page.value < Math.ceil(total.value / pageSize.value)) {
    page.value++
    fetchPunishments()
  }
}

onMounted(fetchPunishments)
</script>

<style scoped>
.punishment-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  text-align: center;
  margin-bottom: 24px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.list {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.item {
  display: grid;
  grid-template-columns: 120px 1fr 120px 100px;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.item:last-child {
  border-bottom: none;
}

.user {
  font-weight: 500;
  color: #333;
}

.violation {
  color: #666;
}

.punishment {
  color: #ff4d4f;
  font-weight: 500;
}

.time {
  color: #999;
  font-size: 14px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
