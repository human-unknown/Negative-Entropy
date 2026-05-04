<template>
  <div class="user-stats">
    <h3 class="section-title">
      数据统计
    </h3>

    <div
      v-if="loading"
      class="loading"
    >
      加载中...
    </div>

    <template v-else>
      <!-- 等级进度 -->
      <div class="level-card">
        <div class="level-info">
          <span
            class="level-badge"
            :class="`lv-${levelInfo.level}`"
          >
            Lv.{{ levelInfo.level }}
          </span>
          <span class="level-name">{{ levelText }}</span>
        </div>
        <div class="exp-bar-wrapper">
          <div class="exp-bar">
            <div
              class="exp-progress"
              :style="{ width: levelInfo.progress + '%' }"
            />
          </div>
          <div class="exp-text">
            经验值 {{ levelInfo.exp }} 点
            <span v-if="levelInfo.nextLevelName"> | 下一级({{ levelInfo.nextLevelName }})还需 {{ nextExpNeed }} 点</span>
            <span v-else> | 已达最高等级</span>
          </div>
        </div>
      </div>

      <!-- 经验记录 -->
      <div class="exp-history-section">
        <h4 class="sub-title">
          经验记录
        </h4>

        <div
          v-if="expHistory.length === 0"
          class="empty"
        >
          暂无记录
        </div>

        <div
          v-else
          class="exp-list"
        >
          <div
            v-for="item in expHistory"
            :key="item.id"
            class="exp-item"
          >
            <span :class="['exp-amount', item.exp >= 0 ? 'positive' : 'negative']">
              {{ item.exp >= 0 ? '+' : '' }}{{ item.exp }}
            </span>
            <span class="exp-reason">{{ item.reason }}</span>
            <span class="exp-time">{{ formatTime(item.created_at) }}</span>
          </div>
        </div>

        <div
          v-if="expTotalPages > 1"
          class="pagination"
        >
          <button
            :disabled="expPage === 1"
            @click="changeExpPage(expPage - 1)"
          >
            上一页
          </button>
          <span class="page-info">{{ expPage }} / {{ expTotalPages }}</span>
          <button
            :disabled="expPage >= expTotalPages"
            @click="changeExpPage(expPage + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { USER_LEVEL_TEXT } from '@/constants/userLevel'
import request from '@/api/request'

const loading = ref(true)
const levelInfo = ref({ level: 1, exp: 0, progress: 0 })
const expHistory = ref([])
const expPage = ref(1)
const expTotal = ref(0)
const expLimit = 20

const levelText = computed(() => USER_LEVEL_TEXT[levelInfo.value.level] || '')
const expTotalPages = computed(() => Math.ceil(expTotal.value / expLimit))
const nextExpNeed = computed(() => {
  if (levelInfo.value.nextThreshold == null) return 0
  return levelInfo.value.nextThreshold - levelInfo.value.exp
})

const loadLevelInfo = async () => {
  try {
    const res = await request.get('/user/level')
    if (res.code === 200) levelInfo.value = res.data
  } catch (err) {
    console.error('获取等级信息失败', err)
  }
}

const loadExpHistory = async () => {
  try {
    const res = await request.get('/user/exp', { params: { page: expPage.value, limit: expLimit } })
    if (res.code === 200) {
      expHistory.value = res.data.list
      expTotal.value = res.data.total
    }
  } catch (err) {
    console.error('获取经验记录失败', err)
  }
}

const changeExpPage = (newPage) => { expPage.value = newPage; loadExpHistory() }
const formatTime = (time) => {
  if (!time) return '-'
  const d = new Date(time)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

onMounted(async () => {
  await Promise.all([loadLevelInfo(), loadExpHistory()])
  loading.value = false
})
</script>

<style scoped>
.user-stats { max-width: 800px; }

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

.level-card {
  padding: 24px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  margin-bottom: 24px;
}

.level-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.level-badge {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
}

.lv-1 { background: #e3f2fd; color: #1565c0; }
.lv-2 { background: #f3e5f5; color: #7b1fa2; }
.lv-3 { background: #fff3e0; color: #e65100; }
.lv-4 { background: #ffebee; color: #c62828; }

.level-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.exp-bar-wrapper { width: 100%; }

.exp-bar {
  height: 12px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.exp-progress {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  border-radius: 6px;
  transition: width 0.3s;
}

.exp-text {
  font-size: 13px;
  color: #666;
}

.sub-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.exp-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exp-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f9f9f9;
  border-radius: 8px;
  font-size: 14px;
}

.exp-amount {
  font-weight: 700;
  min-width: 60px;
}

.exp-amount.positive { color: #67c23a; }
.exp-amount.negative { color: #f56c6c; }

.exp-reason { flex: 1; color: #333; }
.exp-time { color: #999; font-size: 13px; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
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
