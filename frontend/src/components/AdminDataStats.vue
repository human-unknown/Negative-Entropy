<template>
  <div class="data-stats">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          👥
        </div>
        <div class="stat-info">
          <div class="stat-value">
            {{ stats.activeUsers }}
          </div>
          <div class="stat-label">
            活跃用户
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          💬
        </div>
        <div class="stat-info">
          <div class="stat-value">
            {{ stats.topics }}
          </div>
          <div class="stat-label">
            话题总数
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          📝
        </div>
        <div class="stat-info">
          <div class="stat-value">
            {{ stats.speeches }}
          </div>
          <div class="stat-label">
            发言总数
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          ⚠️
        </div>
        <div class="stat-info">
          <div class="stat-value">
            {{ stats.violations }}
          </div>
          <div class="stat-label">
            违规总数
          </div>
        </div>
      </div>
    </div>

    <div class="chart-section">
      <div class="chart-card">
        <h3>用户增长趋势</h3>
        <div class="chart-placeholder">
          <div
            v-for="(item, index) in trends.users"
            :key="index"
            class="trend-bar"
          >
            <div class="bar-label">
              {{ item.date }}
            </div>
            <div class="bar-container">
              <div
                class="bar-fill"
                :style="{ width: `${item.value}%` }"
              />
            </div>
            <div class="bar-value">
              {{ item.count }}
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>话题发布趋势</h3>
        <div class="chart-placeholder">
          <div
            v-for="(item, index) in trends.topics"
            :key="index"
            class="trend-bar"
          >
            <div class="bar-label">
              {{ item.date }}
            </div>
            <div class="bar-container">
              <div
                class="bar-fill"
                :style="{ width: `${item.value}%` }"
              />
            </div>
            <div class="bar-value">
              {{ item.count }}
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>违规趋势</h3>
        <div class="chart-placeholder">
          <div
            v-for="(item, index) in trends.violations"
            :key="index"
            class="trend-bar"
          >
            <div class="bar-label">
              {{ item.date }}
            </div>
            <div class="bar-container">
              <div
                class="bar-fill violation"
                :style="{ width: `${item.value}%` }"
              />
            </div>
            <div class="bar-value">
              {{ item.count }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const stats = ref({
  activeUsers: 0,
  topics: 0,
  speeches: 0,
  violations: 0
})

const trends = ref({
  users: [],
  topics: [],
  violations: []
})

onMounted(() => {
  loadStats()
})

const loadStats = async () => {
  try {
    const res = await request.get('/admin/stats')
    if (res.code === 200) {
      stats.value = res.data
    }
  } catch (err) {
    console.error('统计数据接口暂未实现:', err)
  }
}
</script>

<style scoped>
.data-stats {
  max-width: 1200px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 40px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.chart-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-card {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-card h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #333;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trend-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 80px;
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.bar-container {
  flex: 1;
  height: 24px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a90e2, #357abd);
  transition: width 0.3s;
}

.bar-fill.violation {
  background: linear-gradient(90deg, #ff9800, #f57c00);
}

.bar-value {
  width: 60px;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  flex-shrink: 0;
}
</style>
