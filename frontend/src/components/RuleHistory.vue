<template>
  <div class="rule-history">
    <div class="history-header">
      <h1>规则修改历史</h1>
      <p class="subtitle">记录所有规则变更，保持透明公开</p>
    </div>

    <div class="timeline">
      <div 
        v-for="(record, index) in records" 
        :key="record.id" 
        class="timeline-item"
        :class="record.result.final_decision"
      >
        <div class="timeline-marker">
          <span class="version">v{{ records.length - index }}</span>
        </div>
        
        <div class="timeline-content">
          <div class="record-header">
            <h2>{{ record.debate.title }}</h2>
            <span class="status-tag" :class="record.result.final_decision">
              {{ record.result.final_decision === 'approved' ? '已通过' : '已拒绝' }}
            </span>
          </div>

          <div class="record-body">
            <div class="comparison">
              <div class="compare-item before">
                <h3>修改前</h3>
                <p>{{ record.debate.current_status }}</p>
              </div>
              <div class="compare-arrow">→</div>
              <div class="compare-item after">
                <h3>修改后</h3>
                <p>{{ record.debate.modify_content }}</p>
              </div>
            </div>

            <div class="record-meta">
              <div class="meta-item">
                <span class="label">投票结果</span>
                <span class="value">支持 {{ record.result.support_weight }} / 反对 {{ record.result.oppose_weight }}</span>
              </div>
              <div class="meta-item">
                <span class="label">发起人</span>
                <span class="value">{{ record.debate.initiator_name }}</span>
              </div>
              <div class="meta-item">
                <span class="label">判定时间</span>
                <span class="value">{{ formatTime(record.result.created_at) }}</span>
              </div>
              <div class="meta-item" v-if="record.result.final_decision === 'approved'">
                <span class="label">生效时间</span>
                <span class="value">{{ getEffectiveTime(record.result.created_at) }}</span>
              </div>
            </div>

            <div class="record-conclusion">
              <strong>结论：</strong>{{ record.result.conclusion }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="records.length === 0" class="empty-state">
      <p>暂无规则修改记录</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
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

const getEffectiveTime = (time) => {
  const date = new Date(time)
  date.setDate(date.getDate() + 7)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.rule-history {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}

.history-header {
  text-align: center;
  margin-bottom: 50px;
}

.history-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #000;
  margin: 0 0 10px 0;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.timeline {
  position: relative;
  padding-left: 80px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 40px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ddd;
}

.timeline-item {
  position: relative;
  margin-bottom: 40px;
}

.timeline-marker {
  position: absolute;
  left: -80px;
  top: 0;
  width: 80px;
  text-align: center;
}

.timeline-marker .version {
  display: inline-block;
  width: 50px;
  height: 50px;
  line-height: 50px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid #ddd;
  font-weight: bold;
  font-size: 14px;
  color: #666;
}

.timeline-item.approved .timeline-marker .version {
  border-color: #4caf50;
  color: #4caf50;
  background: #e8f5e9;
}

.timeline-item.rejected .timeline-marker .version {
  border-color: #f44336;
  color: #f44336;
  background: #ffebee;
}

.timeline-content {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 24px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.record-header h2 {
  font-size: 20px;
  font-weight: bold;
  color: #000;
  margin: 0;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-tag.approved {
  background: #4caf50;
  color: #fff;
}

.status-tag.rejected {
  background: #f44336;
  color: #fff;
}

.comparison {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.compare-item {
  flex: 1;
  padding: 16px;
  border-radius: 6px;
}

.compare-item.before {
  background: #f5f5f5;
  border-left: 4px solid #999;
}

.compare-item.after {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.compare-item h3 {
  font-size: 14px;
  font-weight: bold;
  color: #666;
  margin: 0 0 8px 0;
}

.compare-item p {
  font-size: 14px;
  color: #333;
  margin: 0;
  line-height: 1.6;
}

.compare-arrow {
  font-size: 24px;
  color: #999;
  font-weight: bold;
}

.record-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item .label {
  font-size: 12px;
  color: #999;
}

.meta-item .value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.record-conclusion {
  background: #fafafa;
  padding: 12px;
  border-radius: 4px;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}

.record-conclusion strong {
  color: #000;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}
</style>
