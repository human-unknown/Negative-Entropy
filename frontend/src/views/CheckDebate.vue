<template>
  <div class="debate-page">
    <div class="debate-container">
      <h1>AI辩论考核</h1>
      <p class="desc">请针对以下辩题发表你的观点（至少50字）</p>
      
      <div v-if="!submitted" class="debate-form">
        <div class="topic-box">
          <h3>辩题</h3>
          <p class="topic">{{ topic }}</p>
        </div>
        
        <div class="speech-box">
          <textarea 
            v-model="speech" 
            placeholder="请输入你的观点，注意使用逻辑连接词（因为、所以、首先、其次等），保持理性表达..."
            class="speech-input"
            rows="10"
          ></textarea>
          <p class="char-count">{{ speech.length }}/50字</p>
        </div>
        
        <button @click="submit" :disabled="speech.length < 50 || loading" class="submit-btn">
          {{ loading ? '提交中...' : '提交观点' }}
        </button>
      </div>
      
      <div v-else class="result">
        <h2>考核结果</h2>
        <div class="score-detail">
          <div class="score-item">
            <span class="label">逻辑性：</span>
            <span class="value">{{ result.logicScore }}分</span>
          </div>
          <div class="score-item">
            <span class="label">理性度：</span>
            <span class="value">{{ result.rationalScore }}分</span>
          </div>
          <div class="score-item total">
            <span class="label">综合得分：</span>
            <span class="value">{{ result.score }}分</span>
          </div>
        </div>
        <p v-if="result.passed" class="pass-text">恭喜通过考核！</p>
        <p v-else class="fail-text">未通过考核，需要60分以上</p>
        <button @click="checkResult" class="next-btn">查看审核结果</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import request from '@/api/request'

const router = useRouter()
const route = useRoute()
const userId = ref(route.query.userId)

const topic = ref('')
const speech = ref('')
const loading = ref(false)
const submitted = ref(false)
const result = ref(null)

onMounted(async () => {
  try {
    const res = await request.get('/check/debate-topic')
    if (res.code === 200) {
      topic.value = res.data.topic
    }
  } catch (error) {
    alert('加载辩题失败')
  }
})

const submit = async () => {
  if (speech.value.length < 50) {
    alert('发言内容至少50字')
    return
  }
  
  loading.value = true
  try {
    const res = await request.post('/check/debate', {
      userId: userId.value,
      topic: topic.value,
      speech: speech.value
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

const checkResult = () => {
  router.push(`/check/result?userId=${userId.value}`)
}
</script>

<style scoped>
.debate-page {
  min-height: 100vh;
  padding: 40px 20px;
  background: #f5f5f5;
}

.debate-container {
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

.topic-box {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 4px;
}

.topic-box h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #666;
}

.topic {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.speech-box {
  margin-bottom: 24px;
}

.speech-input {
  width: 100%;
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

.char-count {
  text-align: right;
  color: #999;
  font-size: 12px;
  margin-top: 8px;
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
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  text-align: center;
  padding: 40px 0;
}

.score-detail {
  margin: 32px 0;
  padding: 24px;
  background: #f9f9f9;
  border-radius: 4px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  font-size: 16px;
}

.score-item.total {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #ddd;
  font-size: 20px;
  font-weight: bold;
}

.pass-text {
  color: #4caf50;
  font-size: 18px;
  font-weight: 500;
  margin: 24px 0;
}

.fail-text {
  color: #f44336;
  font-size: 18px;
  font-weight: 500;
  margin: 24px 0;
}
</style>
