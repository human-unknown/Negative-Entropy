<template>
  <div class="test-page">
    <div class="test-container">
      <h1 class="test-title">入站逻辑测试</h1>
      
      <div v-if="!submitted" class="test-content">
        <div v-for="(q, index) in questions" :key="index" class="question-block">
          <h3 class="question-title">{{ index + 1 }}. {{ q.question }}</h3>
          <div class="options">
            <label v-for="(opt, i) in q.options" :key="i" class="option-label">
              <input 
                v-model="answers[index]" 
                type="radio" 
                :value="i"
                :name="`q${index}`"
              />
              <span>{{ opt }}</span>
            </label>
          </div>
        </div>
        <button @click="submit" :disabled="!allAnswered" class="submit-btn">提交答案</button>
      </div>

      <div v-else class="result">
        <h2 class="score">得分：{{ score }} / {{ questions.length }}</h2>
        <p class="result-text">{{ resultText }}</p>
        <button @click="reset" class="retry-btn">重新测试</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const questions = [
  {
    question: '以下哪种行为符合社区规范？',
    options: ['理性讨论', '人身攻击', '恶意灌水', '发布广告'],
    correct: 0
  },
  {
    question: '发现他人观点错误时应该？',
    options: ['谩骂对方', '摆事实讲道理', '举报封号', '无视'],
    correct: 1
  },
  {
    question: '参与辩论的正确态度是？',
    options: ['赢得争论', '寻求真理', '攻击对手', '刷存在感'],
    correct: 1
  }
]

const answers = ref([])
const submitted = ref(false)
const score = ref(0)

const allAnswered = computed(() => answers.value.length === questions.length)

const resultText = computed(() => {
  const rate = score.value / questions.length
  if (rate === 1) return '完美！欢迎加入社区'
  if (rate >= 0.6) return '通过测试，请继续保持'
  return '未通过，请重新学习社区规范'
})

const submit = () => {
  score.value = answers.value.filter((a, i) => a === questions[i].correct).length
  submitted.value = true
}

const reset = () => {
  answers.value = []
  submitted.value = false
  score.value = 0
}
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f5f5f5;
}

.test-container {
  width: 100%;
  max-width: 600px;
  background: #fff;
  padding: 40px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-title {
  margin: 0 0 32px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.question-block {
  margin-bottom: 32px;
}

.question-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-label:hover {
  border-color: #333;
  background: #f9f9f9;
}

.option-label input {
  cursor: pointer;
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

.score {
  margin: 0 0 16px;
  font-size: 32px;
  font-weight: 600;
  color: #333;
}

.result-text {
  margin: 0 0 24px;
  font-size: 16px;
  color: #666;
}

@media (max-width: 768px) {
  .test-container {
    padding: 32px 24px;
  }

  .test-title {
    font-size: 20px;
  }
}
</style>
