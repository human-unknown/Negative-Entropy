<template>
  <div class="debate-page">
    <div class="debate-container">
      <h1 class="debate-title">AI辩论考核</h1>
      
      <div v-if="!submitted" class="debate-content">
        <div class="topic-section">
          <h3 class="section-title">辩论议题</h3>
          <p class="topic">{{ currentTopic }}</p>
        </div>

        <div class="speech-section">
          <h3 class="section-title">你的观点（{{ speechLength }}/{{ maxLength }}字）</h3>
          <textarea 
            v-model="speech"
            :maxlength="maxLength"
            placeholder="请阐述你的观点，理性表达..."
            class="speech-input"
          ></textarea>
        </div>

        <button @click="submit" :disabled="!canSubmit" class="submit-btn">提交发言</button>
      </div>

      <div v-else class="result">
        <h2 class="score-title">AI评分结果</h2>
        <div class="score-value">{{ aiScore }} 分</div>
        <div class="feedback">
          <p><strong>逻辑性：</strong>{{ feedback.logic }}</p>
          <p><strong>表达力：</strong>{{ feedback.expression }}</p>
          <p><strong>文明度：</strong>{{ feedback.civility }}</p>
        </div>
        <button @click="reset" class="retry-btn">重新考核</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const topics = [
  '人工智能是否会取代人类工作？',
  '网络实名制是否应该全面推行？',
  '远程办公是否优于传统办公？'
]

const currentTopic = ref(topics[Math.floor(Math.random() * topics.length)])
const speech = ref('')
const maxLength = 500
const submitted = ref(false)
const aiScore = ref(0)
const feedback = ref({})

const speechLength = computed(() => speech.value.length)
const canSubmit = computed(() => speech.value.length >= 50)

const submit = () => {
  // 模拟AI评分
  aiScore.value = Math.floor(Math.random() * 30) + 70
  feedback.value = {
    logic: '论证结构清晰，逻辑严密',
    expression: '表达流畅，用词准确',
    civility: '态度理性，符合社区规范'
  }
  submitted.value = true
}

const reset = () => {
  currentTopic.value = topics[Math.floor(Math.random() * topics.length)]
  speech.value = ''
  submitted.value = false
  aiScore.value = 0
  feedback.value = {}
}
</script>

<style scoped>
.debate-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f5f5f5;
}

.debate-container {
  width: 100%;
  max-width: 700px;
  background: #fff;
  padding: 40px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.debate-title {
  margin: 0 0 32px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.topic-section, .speech-section {
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.topic {
  margin: 0;
  padding: 16px;
  background: #f9f9f9;
  border-left: 4px solid #333;
  font-size: 16px;
  color: #333;
}

.speech-input {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.speech-input:focus {
  outline: none;
  border-color: #333;
}

.submit-btn, .retry-btn {
  width: 100%;
  padding: 14px;
  border: none;
  background: #333;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled), .retry-btn:hover {
  background: #000;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  text-align: center;
}

.score-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.score-value {
  margin-bottom: 24px;
  font-size: 48px;
  font-weight: 700;
  color: #333;
}

.feedback {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 4px;
  text-align: left;
}

.feedback p {
  margin: 0 0 12px;
  font-size: 14px;
  color: #666;
}

.feedback p:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .debate-container {
    padding: 32px 24px;
  }

  .debate-title {
    font-size: 20px;
  }
}
</style>
