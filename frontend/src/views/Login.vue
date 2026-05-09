<template>
  <div class="login-page">
    <div class="login-card">
      <h1>逆熵</h1>
      <p class="subtitle">理性辩论平台</p>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="account">
          <el-input v-model="form.account" placeholder="账号" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" native-type="submit" style="width:100%">
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="links">
        <router-link to="/register">注册账号</router-link>
        <router-link to="/reset-password">忘记密码</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/api/request'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({ account: 'admin', password: 'admin123' })

const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  loading.value = true
  try {
    const res = await request.post('/auth/login', form)
    if (res.code === 200) {
      userStore.login(res.data.token, res.data.user)
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (err) {
    ElMessage.error('登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
}
.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.login-card h1 {
  text-align: center;
  font-size: 28px;
  margin: 0 0 4px;
  color: #333;
}
.subtitle {
  text-align: center;
  color: #999;
  margin: 0 0 32px;
}
.links {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.links a {
  color: #409eff;
  text-decoration: none;
}
</style>
