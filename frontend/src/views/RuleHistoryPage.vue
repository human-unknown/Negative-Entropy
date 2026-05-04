<template>
  <div>
    <div class="page-nav">
      <button @click="$router.push('/rules')">
        ← 返回规则辩论
      </button>
    </div>

    <div
      v-if="loading"
      class="loading"
    >
      加载中...
    </div>

    <div
      v-else
      class="history-wrapper"
    >
      <RuleHistory :records="records" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import RuleHistory from '@/components/RuleHistory.vue'

const records = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/rule-debate')
    if (res.code === 200) {
      const finished = res.data.filter(d => d.status === 'approved' || d.status === 'rejected')
      records.value = await Promise.all(finished.map(async (d) => {
        let result = { final_decision: d.status, support_weight: 0, oppose_weight: 0, conclusion: '', created_at: d.created_at }
        try {
          const resultRes = await request.get(`/rule-debate/${d.id}/result`)
          if (resultRes.code === 200) result = resultRes.data
        } catch (_) {
          /* ignore — default result used */ }
        return { debate: d, result }
      }))
    }
  } catch (err) {
    console.error('加载规则修改历史失败:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-nav {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 20px 0;
}

.page-nav button {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #999;
}

.history-wrapper {
  padding: 0;
}
</style>
