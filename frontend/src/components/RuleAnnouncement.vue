<template>
  <div class="rule-announcement">
    <div class="announcement-header">
      <h1>规则修改公示</h1>
      <div class="status-badge" :class="result.final_decision">
        {{ result.final_decision === 'approved' ? '已通过' : '已拒绝' }}
      </div>
    </div>

    <div class="announcement-content">
      <section class="section">
        <h2>修改标题</h2>
        <p class="title-text">{{ debate.title }}</p>
      </section>

      <section class="section">
        <h2>现状说明</h2>
        <p class="content-text">{{ debate.current_status }}</p>
      </section>

      <section class="section">
        <h2>修改内容</h2>
        <p class="content-text">{{ debate.modify_content }}</p>
      </section>

      <section class="section">
        <h2>投票结果</h2>
        <div class="vote-result">
          <div class="vote-item support">
            <span class="label">支持方</span>
            <span class="value">{{ result.support_weight }}</span>
          </div>
          <div class="vote-item oppose">
            <span class="label">反对方</span>
            <span class="value">{{ result.oppose_weight }}</span>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>最终结论</h2>
        <p class="conclusion-text">{{ result.conclusion }}</p>
      </section>

      <section class="section" v-if="result.final_decision === 'approved'">
        <h2>生效时间</h2>
        <p class="effective-time">{{ effectiveTime }}</p>
      </section>

      <div class="footer">
        <p>发起人：{{ debate.initiator_name }}</p>
        <p>判定时间：{{ formatTime(result.created_at) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  debate: {
    type: Object,
    required: true
  },
  result: {
    type: Object,
    required: true
  }
})

const effectiveTime = computed(() => {
  const date = new Date(props.result.created_at)
  date.setDate(date.getDate() + 7) // 7天后生效
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
})

const formatTime = (time) => {
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.rule-announcement {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  background: #fff;
}

.announcement-header {
  text-align: center;
  padding-bottom: 30px;
  border-bottom: 2px solid #333;
  margin-bottom: 40px;
}

.announcement-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #000;
  margin: 0 0 20px 0;
  letter-spacing: 2px;
}

.status-badge {
  display: inline-block;
  padding: 8px 24px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 4px;
}

.status-badge.approved {
  background: #4caf50;
  color: #fff;
}

.status-badge.rejected {
  background: #f44336;
  color: #fff;
}

.announcement-content {
  line-height: 1.8;
}

.section {
  margin-bottom: 32px;
}

.section h2 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #ddd;
}

.title-text {
  font-size: 20px;
  font-weight: bold;
  color: #000;
  margin: 0;
}

.content-text {
  font-size: 16px;
  color: #333;
  margin: 0;
  white-space: pre-wrap;
}

.vote-result {
  display: flex;
  gap: 40px;
  margin-top: 16px;
}

.vote-item {
  flex: 1;
  padding: 20px;
  border-radius: 4px;
  text-align: center;
}

.vote-item.support {
  background: #e8f5e9;
  border: 2px solid #4caf50;
}

.vote-item.oppose {
  background: #ffebee;
  border: 2px solid #f44336;
}

.vote-item .label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.vote-item .value {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #000;
}

.conclusion-text {
  font-size: 16px;
  color: #000;
  background: #f5f5f5;
  padding: 16px;
  border-left: 4px solid #333;
  margin: 0;
}

.effective-time {
  font-size: 18px;
  font-weight: bold;
  color: #4caf50;
  margin: 0;
}

.footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
  text-align: right;
  color: #666;
  font-size: 14px;
}

.footer p {
  margin: 4px 0;
}
</style>
