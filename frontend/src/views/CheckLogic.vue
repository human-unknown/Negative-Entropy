<template>
  <div class="check-page">
    <div class="check-container">
      <h1>逻辑测试</h1>
      <p class="desc">请完成以下逻辑题（需答对3题以上）</p>
      
      <div v-if="!submitted" class="questions">
        <div v-for="(q, idx) in questions" :key="idx" class="question-item">
          <p class="question-text">{{ idx + 1 }}. {{ q.question }}</p>
          <div class="options">
            <label v-for="(opt, i) in q.options" :key="i" class="option-label">
              <input type="radio" :name="`q${idx}`" :value="i" v-model="answers[idx]" />
              <span>{{ opt }}</span>
            </label>
          </div>
        </div>
        <button @click="submit" :disabled="!canSubmit || loading" class="submit-btn">
          {{ loading ? '提交中...' : '提交答案' }}
        </button>
      </div>
      
      <div v-else class="result">
        <h2>测试结果</h2>
        <p class="score">得分：{{ result.score }}分</p>
        <p class="correct">答对：{{ result.correct }}/{{ result.total }}题</p>
        <button @click="nextStep" class="next-btn">下一步：AI辩论考核</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import request from '@/api/request'

const router = useRouter()
const route = useRoute()
const userId = ref(route.query.userId)

const questions = ref([])
const answers = ref({})
const loading = ref(false)
const submitted = ref(false)
const result = ref(null)

const canSubmit = computed(() => {
  return Object.keys(answers.value).length === questions.value.length
})

onMounted(async () => {
  try {
    const res = await request.get('/check/logic-test')
    if (res.code === 200) {
      questions.value = res.data.questions
    }
  } catch (error) {
    alert('加载题目失败')
  }
})

const submit = async () => {
  loading.value = true
  try {
    const answerList = questions.value.map((q, idx) => ({
      question: q.question,
      answer: answers.value[idx]
    }))
    
    const res = await request.post('/check/logic-test', {
      userId: userId.value,
      answers: answerList
    })
    
    if (res.code === 200) {
      result.value = res.data
      submitted.value = true
    } else {
      alert(res.message || '提交失败')
    }
  } catch (error) {
    alert('提交失败，请重试')
  } finally {
    loading.value = false
  }
}

const nextStep = () => {
  router.push(`/check/debate?userId=${userId.value}`)
}
</script>

<style scoped>
.check-page {
  min-height: 100vh;
  padding: 40px 20px;
  background: #f5f5f5;
}

.check-container {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  padding: 40px;
  border-radius: 4px;
}

h1 {
  margin: 0 0 16px;
  font-size: 28px;
  text-align: center;
}

.desc {
  text-align: center;
  color: #666;
  margin-bottom: 32px;
}

.question-item {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #eee;
}

.question-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
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

.submit-btn, .next-btn {
  width: 100%;
  padding: 14px;
  border: none;
  background: #333;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  margin-top: 24px;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  text-align: center;
  padding: 40px 0;
}

.score {
  font-size: 48px;
  font-weight: bold;
  color: #333;
  margin: 24px 0;
}

.correct {
  font-size: 18px;
  color: #666;
  margin-bottom: 32px;
}
</style>
