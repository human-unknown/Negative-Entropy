<template>
  <div class="debate-list">
    <div class="header">
      <div class="categories">
        <button
          v-for="cat in categories"
          :key="cat.value"
          :class="['cat-btn', { active: category === cat.value }]"
          @click="category = cat.value; loadDebates()"
        >
          {{ cat.label }}
        </button>
      </div>
      <div class="search-box">
        <input v-model="keyword" @keyup.enter="loadDebates" placeholder="搜索辩论话题..." />
        <button @click="loadDebates">搜索</button>
        <button v-if="canCreate" class="create-btn" @click="$router.push('/debates/create')">发布话题</button>
      </div>
    </div>

    <div class="toolbar">
      <div class="sort-btns">
        <button 
          v-for="s in sorts" 
          :key="s.value"
          :class="['sort-btn', { active: sort === s.value }]"
          @click="sort = s.value; loadDebates()"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <div class="list">
      <div v-for="item in list" :key="item.id" class="card" @click="goToDebate(item.id)">
        <div class="card-header">
          <span class="category-tag">{{ getCategoryLabel(item.category) }}</span>
          <span class="status-tag" :class="`status-${item.status}`">{{ getStatusLabel(item.status) }}</span>
        </div>
        <h3 class="title">{{ item.title }}</h3>
        <p class="desc">{{ item.description }}</p>
        <div class="card-footer">
          <span>👤 {{ item.publisher_name || '匿名' }}</span>
          <span>👥 {{ item.participant_count || 0 }}人参与</span>
          <span>🔥 {{ item.heat || 0 }}热度</span>
          <span>{{ formatTime(item.created_at) }}</span>
        </div>
      </div>
    </div>

    <div class="pagination">
      <button :disabled="page === 1" @click="page--; loadDebates()">上一页</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="page++; loadDebates()">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getDebateList } from '@/api/debate'
import { USER_LEVEL } from '@/constants/userLevel'

const router = useRouter()

const categories = [
  { label: '全部', value: '' },
  { label: '科技', value: 'tech' },
  { label: '社会', value: 'society' },
  { label: '文化', value: 'culture' },
  { label: '经济', value: 'economy' }
]

const categoryLabels = {
  tech: '科技',
  society: '社会',
  culture: '文化',
  economy: '经济'
}

const statusLabels = {
  0: '待开始',
  1: '进行中',
  2: '已结束'
}

const sorts = [
  { label: '最新', value: 'time' },
  { label: '最热', value: 'heat' },
  { label: '人气', value: 'participants' }
]

const category = ref('')
const keyword = ref('')
const sort = ref('time')
const page = ref(1)
const pageSize = 10
const list = ref([])
const total = ref(0)
const totalPages = ref(0)

const loadDebates = async () => {
  try {
    const res = await getDebateList({
      category: category.value,
      keyword: keyword.value,
      sort: sort.value,
      page: page.value,
      pageSize
    })
    list.value = res.list || []
    total.value = res.total || 0
    totalPages.value = Math.ceil(total.value / pageSize)
  } catch (err) {
    console.error(err)
  }
}

const canCreate = computed(() => {
  const userStr = localStorage.getItem('user')
  if (!userStr) return false
  const user = JSON.parse(userStr)
  return user.level >= USER_LEVEL.ADVANCED
})

const getCategoryLabel = (cat) => categoryLabels[cat] || cat
const getStatusLabel = (status) => statusLabels[status] || '未知'

const goToDebate = (id) => {
  router.push(`/debates/${id}`)
}

const formatTime = (time) => {
  const d = new Date(time)
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  loadDebates()
})
</script>

<style scoped>
.debate-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.categories {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.cat-btn {
  padding: 8px 16px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border-radius: 20px;
  transition: all 0.3s;
}

.cat-btn:hover, .cat-btn.active {
  background: var(--color-primary);
  color: #fff;
}

.search-box {
  display: flex;
  gap: 10px;
}

.search-box input {
  flex: 1;
  padding: 10px 15px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
}

.search-box button {
  padding: 10px 24px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
}

.create-btn {
  background: var(--color-success) !important;
}

.toolbar {
  margin-bottom: 20px;
}

.sort-btns {
  display: flex;
  gap: 10px;
}

.sort-btn {
  padding: 6px 12px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 13px;
}

.sort-btn.active {
  color: var(--color-primary);
  background: rgba(74, 144, 226, 0.1);
}

.list {
  display: grid;
  gap: 15px;
  margin-bottom: 30px;
}

.card {
  padding: 20px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: transform 0.2s;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-tag {
  padding: 4px 10px;
  background: rgba(74, 144, 226, 0.2);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 12px;
}

.status-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-0 {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.status-1 {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.status-2 {
  background: rgba(144, 147, 153, 0.2);
  color: #909399;
}

.title {
  font-size: 18px;
  margin-bottom: 10px;
  color: var(--color-text);
}

.desc {
  color: var(--color-text-secondary);
  margin-bottom: 15px;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.pagination button {
  padding: 8px 20px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  border-radius: 6px;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination span {
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .debate-list {
    padding: 15px;
  }

  .categories {
    gap: 8px;
  }

  .cat-btn {
    padding: 6px 12px;
    font-size: 13px;
  }

  .search-box {
    flex-direction: column;
  }

  .search-box button {
    width: 100%;
  }

  .sort-btns {
    justify-content: space-between;
  }

  .card {
    padding: 15px;
  }

  .title {
    font-size: 16px;
  }

  .card-footer {
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
  }
}
</style>
