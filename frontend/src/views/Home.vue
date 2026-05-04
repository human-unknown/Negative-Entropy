<template>
  <div class="home">
    <div class="container">
      <h1>逆熵 - 理性辩论平台</h1>
      <p class="subtitle">
        基于逻辑与理性的辩论社区
      </p>
      
      <div
        v-if="!isLoggedIn"
        class="auth-section"
      >
        <div class="login-form">
          <h2>登录</h2>
          <input
            v-model="loginAccount"
            placeholder="手机号/邮箱"
          >
          <input
            v-model="loginPassword"
            type="password"
            placeholder="密码"
          >
          <button @click="handleLogin">
            登录
          </button>
          <p class="hint-text">
            管理员：13900000001
          </p>
          <button
            class="secondary"
            @click="$router.push('/register')"
          >
            注册账号
          </button>
        </div>
      </div>
      
      <div
        v-else
        class="user-section"
      >
        <p>欢迎回来，{{ user.name }}</p>
        <button @click="$router.push('/profile')">
          个人中心
        </button>
        <button
          v-if="user.level === 4"
          class="admin-btn"
          @click="$router.push('/admin')"
        >
          管理后台
        </button>
        <button
          class="secondary"
          @click="handleLogout"
        >
          退出登录
        </button>
      </div>
      
      <div class="nav-section">
        <button
          class="primary"
          @click="$router.push('/debates')"
        >
          浏览辩论
        </button>
        <button
          v-if="canCreate"
          @click="$router.push('/debates/create')"
        >
          发起辩论
        </button>
        <button
          class="primary"
          @click="$router.push('/rules')"
        >
          规则辩论
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { USER_LEVEL } from '@/constants/userLevel'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const loginAccount = ref('')
const loginPassword = ref('')
const user = ref(null)

// 用 ref 替代 computed，使登录状态响应式
const isLoggedIn = ref(false)

// 初始化时从 localStorage 读取登录状态
const initAuth = () => {
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token
  if (token) {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try { user.value = JSON.parse(userStr) } catch { user.value = null }
    }
  }
}

const canCreate = computed(() => user.value?.level >= USER_LEVEL.ADVANCED)

const handleLogin = async () => {
  if (!loginAccount.value) return ElMessage.warning('请输入账号')
  try {
    const res = await request.post('/auth/login', {
      account: loginAccount.value,
      password: loginPassword.value || '123456'
    })
    if (res.code === 200) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      user.value = res.data.user
      isLoggedIn.value = true
      ElMessage.success('登录成功')
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (err) {
    ElMessage.error(`登录失败：${err?.response?.data?.message || err.message}`)
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  user.value = null
  isLoggedIn.value = false
}

onMounted(() => {
  initAuth()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  max-width: 500px;
  width: 90%;
}

h1 {
  text-align: center;
  margin-bottom: 10px;
  color: #333;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
}

.auth-section, .user-section {
  margin-bottom: 30px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-form h2 {
  margin-bottom: 10px;
  font-size: 18px;
}

input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

button.primary {
  background: #667eea;
  color: white;
}

button.primary:hover {
  background: #5568d3;
}

button.secondary {
  background: #f5f5f5;
  color: #333;
}

button.secondary:hover {
  background: #e0e0e0;
}

.nav-section {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.user-section {
  text-align: center;
}

.user-section p {
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.user-section button {
  margin: 0 5px;
}

button.admin-btn {
  background: #e74c3c;
  color: white;
}

button.admin-btn:hover {
  background: #c0392b;
}
</style>
