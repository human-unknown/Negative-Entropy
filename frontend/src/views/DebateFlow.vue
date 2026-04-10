<template>
  <div class="debate-flow">
    <h2>辩论流程联调测试</h2>
    
    <!-- 步骤1: 选择立场 -->
    <div v-if="step === 1" class="step">
      <div class="step-title">步骤1: 选择立场</div>
      <StanceSelector
        :topic="mockTopic"
        :proCount="proCount"
        :conCount="conCount"
        :audienceCount="audienceCount"
        @joined="handleJoined"
      />
    </div>

    <!-- 步骤2: 辩手发言 -->
    <div v-if="step === 2 && userStance !== 3" class="step">
      <div class="step-title">步骤2: 辩手发言</div>
      <SpeechInput
        :topicId="mockTopic.id"
        @submitted="handleSpeechSubmitted"
      />
    </div>

    <!-- 步骤2: 观众发言 -->
    <div v-if="step === 2 && userStance === 3" class="step">
      <div class="step-title">步骤2: 观众发言</div>
      <AudienceInput
        :topicId="mockTopic.id"
        :pendingCount="pendingCount"
        @submitted="handleSpeechSubmitted"
      />
    </div>

    <!-- 步骤3: 发言列表展示 -->
    <div v-if="step >= 2" class="step">
      <div class="step-title">步骤3: 发言展示（实时）</div>
      <div v-if="speeches.length === 0" class="empty-tip">暂无发言</div>
      <SpeechList v-else :speeches="speeches" />
      <button @click="refreshSpeeches" class="refresh-btn">🔄 刷新发言</button>
    </div>

    <!-- 调试信息 -->
    <div class="debug-info">
      <h4>📊 调试信息</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">当前步骤:</span>
          <span class="value">{{ step }}</span>
        </div>
        <div class="info-item">
          <span class="label">用户立场:</span>
          <span class="value">{{ getStanceText(userStance) }}</span>
        </div>
        <div class="info-item">
          <span class="label">正方人数:</span>
          <span class="value">{{ proCount }}/{{ mockTopic.pro_limit }}</span>
        </div>
        <div class="info-item">
          <span class="label">反方人数:</span>
          <span class="value">{{ conCount }}/{{ mockTopic.con_limit }}</span>
        </div>
        <div class="info-item">
          <span class="label">观众人数:</span>
          <span class="value">{{ audienceCount }}</span>
        </div>
        <div class="info-item">
          <span class="label">发言总数:</span>
          <span class="value">{{ speeches.length }}</span>
        </div>
        <div class="info-item">
          <span class="label">审核通过:</span>
          <span class="value success">{{ speeches.filter(s => s.audit_status === 1).length }}</span>
        </div>
        <div class="info-item">
          <span class="label">待审核:</span>
          <span class="value warning">{{ speeches.filter(s => s.audit_status === 0).length }}</span>
        </div>
      </div>
      <button @click="resetFlow" class="reset-btn">🔄 重置流程</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import StanceSelector from '@/components/StanceSelector.vue'
import SpeechInput from '@/components/SpeechInput.vue'
import AudienceInput from '@/components/AudienceInput.vue'
import SpeechList from '@/components/SpeechList.vue'
import { getSpeeches } from '@/api/debate'

const step = ref(1)
const userStance = ref(null)
const proCount = ref(0)
const conCount = ref(0)
const audienceCount = ref(0)
const pendingCount = ref(0)

const mockTopic = ref({
  id: 1,
  title: '人工智能是否会取代人类工作？',
  pro_limit: 5,
  con_limit: 5,
  status: 0
})

const speeches = ref([])

const getStanceText = (stance) => {
  if (stance === 1) return '正方'
  if (stance === 2) return '反方'
  if (stance === 3) return '观众'
  return '未选择'
}

const handleJoined = (stance) => {
  userStance.value = stance
  if (stance === 1) proCount.value++
  else if (stance === 2) conCount.value++
  else if (stance === 3) audienceCount.value++
  
  step.value = 2
  ElMessage.success(`已加入${getStanceText(stance)}`)
}

const handleSpeechSubmitted = async () => {
  ElMessage.success('发言已提交')
  // 延迟刷新发言列表
  setTimeout(() => {
    refreshSpeeches()
  }, 500)
}

const refreshSpeeches = async () => {
  try {
    const res = await getSpeeches(mockTopic.value.id)
    if (res.code === 200) {
      speeches.value = res.data
      ElMessage.success(`已刷新，共${res.data.length}条发言`)
    }
  } catch (err) {
    console.error('刷新发言失败:', err)
    ElMessage.error('刷新失败')
  }
}

const resetFlow = () => {
  step.value = 1
  userStance.value = null
  proCount.value = 0
  conCount.value = 0
  audienceCount.value = 0
  pendingCount.value = 0
  speeches.value = []
  ElMessage.info('流程已重置')
}

onMounted(() => {
  refreshSpeeches()
})
</script>

<style scoped>
.debate-flow {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: var(--color-text);
  font-size: 24px;
}

.step {
  margin-bottom: 30px;
}

.step-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid var(--color-primary);
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin-bottom: 15px;
}

.refresh-btn {
  width: 100%;
  margin-top: 15px;
  padding: 12px 20px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.refresh-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.debug-info {
  margin-top: 40px;
  padding: 25px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.debug-info h4 {
  margin: 0 0 20px 0;
  color: var(--color-text);
  font-size: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.info-item .label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.info-item .value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.info-item .value.success {
  color: #27ae60;
}

.info-item .value.warning {
  color: var(--color-warning);
}

.reset-btn {
  width: 100%;
  padding: 10px 16px;
  background: var(--color-danger);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.reset-btn:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .debate-flow {
    padding: 15px;
  }

  h2 {
    font-size: 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
