<template>
  <div class="register-page">
    <div class="register-container">
      <h1 class="register-title">
        注册账号
      </h1>
      <div class="register-form">
        <!-- 账号类型选择 -->
        <div class="form-group">
          <div class="account-type-tabs">
            <button 
              :class="['tab', { active: accountType === 'phone' }]"
              @click="accountType = 'phone'"
            >
              手机号
            </button>
            <button 
              :class="['tab', { active: accountType === 'email' }]"
              @click="accountType = 'email'"
            >
              邮箱
            </button>
          </div>
          <input 
            v-model="account"
            :type="accountType === 'email' ? 'email' : 'tel'"
            :placeholder="accountType === 'phone' ? '请输入手机号' : '请输入邮箱'"
            class="form-input"
            @blur="validateAccount"
          >
          <span
            v-if="accountError"
            class="error-text"
          >{{ accountError }}</span>
        </div>

        <!-- 用户名 -->
        <div class="form-group">
          <input
            v-model="username"
            type="text"
            placeholder="请输入真实姓名"
            class="form-input"
            @input="validateUsername"
          >
          <span class="hint-text">必须包含真实姓氏，禁止使用娱乐化昵称</span>
          <span
            v-if="usernameError"
            class="error-text"
          >{{ usernameError }}</span>
        </div>

        <!-- 密码 -->
        <div class="form-group">
          <input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            class="form-input"
          >
        </div>

        <!-- 确认密码 -->
        <div class="form-group">
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            class="form-input"
            @blur="validatePassword"
          >
          <span
            v-if="passwordError"
            class="error-text"
          >{{ passwordError }}</span>
        </div>

        <!-- 验证码 -->
        <div class="form-group">
          <div class="captcha-row">
            <input
              v-model="captcha"
              type="text"
              :placeholder="accountType === 'phone' ? '请输入短信验证码' : '请输入图形验证码'"
              class="form-input captcha-input"
            >
            <button
              class="captcha-btn"
              type="button"
            >
              {{ accountType === 'phone' ? '获取验证码' : '刷新' }}
            </button>
          </div>
        </div>

        <!-- 用户协议 -->
        <div class="form-group">
          <label class="agreement-label">
            <input
              v-model="agreed"
              type="checkbox"
              class="agreement-checkbox"
            >
            <span>我已阅读并同意<a
              href="#"
              class="agreement-link"
            >用户协议</a>和<a
              href="#"
              class="agreement-link"
            >隐私政策</a></span>
          </label>
        </div>

        <!-- 提交按钮 -->
        <button
          :disabled="!canSubmit"
          :class="['submit-btn', { loading }]"
          @click="handleSubmit"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const router = useRouter()
const accountType = ref('phone')
const account = ref('')
const accountError = ref('')
const username = ref('')
const usernameError = ref('')
const password = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const captcha = ref('1234')
const agreed = ref(false)
const loading = ref(false)

const canSubmit = computed(() => {
  return account.value &&
         username.value &&
         password.value &&
         confirmPassword.value &&
         captcha.value &&
         agreed.value &&
         !accountError.value &&
         !usernameError.value &&
         !passwordError.value
})

const handleSubmit = async () => {
  if (!canSubmit.value || loading.value) return
  
  loading.value = true
  try {
    const registerData = {
      account: account.value,
      password: password.value,
      name: username.value
    }
    
    if (accountType.value === 'phone') {
      registerData.phone = account.value
    } else {
      registerData.email = account.value
    }
    
    const res = await request.post('/auth/register', registerData)
    
    if (res.code === 200) {
      ElMessage.success('注册成功！请进行用户名校验和考核')
      router.push(`/check/logic?userId=${res.data.userId}`)
    } else {
      ElMessage.error(res.message || '注册失败')
    }
  } catch (error) {
    console.error('注册失败:', error)
    ElMessage.error(error.response?.data?.message || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}

const validateAccount = () => {
  accountError.value = ''
  if (!account.value) return
  
  if (accountType.value === 'phone') {
    if (!/^1[3-9]\d{9}$/.test(account.value)) {
      accountError.value = '请输入正确的手机号'
    }
  } else {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.value)) {
      accountError.value = '请输入正确的邮箱地址'
    }
  }
}

const validateUsername = () => {
  usernameError.value = ''
  if (!username.value) return
  
  const commonSurnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '朱', '马', '胡', '郭', '林', '何', '高', '梁', '郑', '罗', '宋', '谢', '唐', '韩', '曹', '许', '邓', '萧', '冯', '曾', '程', '蔡', '彭', '潘', '袁', '于', '董', '余', '苏', '叶', '吕', '魏', '蒋', '田', '杜', '丁', '沈', '姜', '范', '江', '傅', '钟', '卢', '汪', '戴', '崔', '任', '陆', '廖', '姚', '方', '金', '邱', '夏', '谭', '韦', '贾', '邹', '石', '熊', '孟', '秦', '阎', '薛', '侯', '雷', '白', '龙', '段', '郝', '孔', '邵', '史', '毛', '常', '万', '顾', '赖', '武', '康', '贺', '严', '尹', '钱', '施', '牛', '洪', '龚']
  const hasSurname = commonSurnames.some(surname => username.value.startsWith(surname))
  
  if (!hasSurname) {
    usernameError.value = '请输入真实姓名，必须包含姓氏'
  }
}

const validatePassword = () => {
  passwordError.value = ''
  if (!confirmPassword.value) return
  
  if (password.value !== confirmPassword.value) {
    passwordError.value = '两次输入的密码不一致'
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f5f5f5;
}

.register-container {
  width: 100%;
  max-width: 420px;
  background: #fff;
  padding: 40px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.register-title {
  margin: 0 0 32px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.register-form {
  width: 100%;
}

.form-group {
  margin-bottom: 20px;
}

.account-type-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  border-color: #333;
  background: #333;
  color: #fff;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #333;
}

.hint-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.error-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #f44336;
}

.captcha-row {
  display: flex;
  gap: 12px;
}

.captcha-input {
  flex: 1;
}

.captcha-btn {
  padding: 12px 20px;
  border: 1px solid #333;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  white-space: nowrap;
  transition: all 0.2s;
}

.captcha-btn:hover {
  background: #333;
  color: #fff;
}

.agreement-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.agreement-checkbox {
  cursor: pointer;
}

.agreement-link {
  color: #333;
  text-decoration: none;
}

.agreement-link:hover {
  text-decoration: underline;
}

.submit-btn {
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

.submit-btn:hover:not(:disabled) {
  background: #000;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.submit-btn.loading {
  opacity: 0.7;
}

@media (max-width: 768px) {
  .register-container {
    max-width: 100%;
    padding: 32px 24px;
  }

  .register-title {
    font-size: 20px;
    margin-bottom: 24px;
  }
}

@media (max-width: 480px) {
  .register-page {
    padding: 16px;
  }

  .register-container {
    padding: 24px 20px;
    box-shadow: none;
  }
}
</style>
