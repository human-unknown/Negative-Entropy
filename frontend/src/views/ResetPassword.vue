<template>
  <div class="reset-page">
    <div class="reset-container">
      <h1 class="reset-title">
        找回密码
      </h1>
      
      <div class="reset-form">
        <!-- 账号类型 -->
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
          >
        </div>

        <!-- 验证码 -->
        <div class="form-group">
          <div class="captcha-row">
            <input 
              v-model="captcha"
              type="text"
              placeholder="请输入验证码"
              class="form-input captcha-input"
            >
            <button
              class="captcha-btn"
              type="button"
              :disabled="!canSendCode"
              @click="sendCode"
            >
              {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
            </button>
          </div>
        </div>

        <!-- 新密码 -->
        <div class="form-group">
          <input 
            v-model="newPassword"
            type="password"
            placeholder="请输入新密码"
            class="form-input"
          >
        </div>

        <!-- 确认密码 -->
        <div class="form-group">
          <input 
            v-model="confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            class="form-input"
            @blur="validatePassword"
          >
          <span
            v-if="passwordError"
            class="error-text"
          >{{ passwordError }}</span>
        </div>

        <button
          :disabled="!canSubmit"
          class="submit-btn"
          @click="submit"
        >
          重置密码
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { sendResetCode, resetPassword } from '../api/security'
import { showMessage } from '../utils/message'

const router = useRouter()

const accountType = ref('phone')
const account = ref('')
const captcha = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const countdown = ref(0)
const sending = ref(false)
const submitting = ref(false)

const canSubmit = computed(() => {
  return account.value && captcha.value && newPassword.value && confirmPassword.value && !passwordError.value && !submitting.value
})

const canSendCode = computed(() => {
  return account.value && countdown.value === 0 && !sending.value
})

const validatePassword = () => {
  passwordError.value = ''
  if (!confirmPassword.value) return
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = '两次输入的密码不一致'
  } else if (newPassword.value.length < 6) {
    passwordError.value = '密码至少6个字符'
  }
}

const sendCode = async () => {
  if (!canSendCode.value) return
  
  const accountRegex = accountType.value === 'phone'
    ? /^1[3-9]\d{9}$/
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!accountRegex.test(account.value)) {
    showMessage(accountType.value === 'phone' ? '请输入正确的手机号' : '请输入正确的邮箱', 'error')
    return
  }

  sending.value = true
  try {
    const res = await sendResetCode(account.value)
    if (res.code === 200) {
      showMessage('验证码已发送', 'success')
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      showMessage(res.message || '发送失败', 'error')
    }
  } catch (error) {
    showMessage('发送失败，请稍后重试', 'error')
  } finally {
    sending.value = false
  }
}

const submit = async () => {
  if (!canSubmit.value) return
  
  validatePassword()
  if (passwordError.value) return

  submitting.value = true
  try {
    const res = await resetPassword(account.value, captcha.value, newPassword.value)
    if (res.code === 200) {
      showMessage('密码重置成功，请登录', 'success')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      showMessage(res.message || '重置失败', 'error')
    }
  } catch (error) {
    showMessage('重置失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.reset-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f5f5f5;
}

.reset-container {
  width: 100%;
  max-width: 420px;
  background: #fff;
  padding: 40px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reset-title {
  margin: 0 0 32px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.reset-form {
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

.error-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #f44336;
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

@media (max-width: 768px) {
  .reset-container {
    max-width: 100%;
    padding: 32px 24px;
  }

  .reset-title {
    font-size: 20px;
    margin-bottom: 24px;
  }
}

@media (max-width: 480px) {
  .reset-page {
    padding: 16px;
  }

  .reset-container {
    padding: 24px 20px;
    box-shadow: none;
  }
}
</style>
