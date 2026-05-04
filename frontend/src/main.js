import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import App from './App.vue'
import './assets/styles/global.css'

const app = createApp(App)
const pinia = createPinia()

// 全局错误处理器 — 防止 Vue 实例崩溃导致白屏
app.config.errorHandler = (err, _instance, info) => {
  console.error('全局 Vue 错误:', err)
  console.error('错误来源:', info)

  const root = document.getElementById('app')
  if (root && !root.querySelector('.app-loading, .app-crash')) {
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#1a1a2e;color:#e0e0e0;padding:20px;text-align:center">
        <h2 style="margin-bottom:12px">页面出现异常</h2>
        <p style="margin-bottom:20px;color:#999;max-width:400px">${err?.message || '未知错误'}</p>
        <button onclick="location.reload()" style="padding:10px 24px;background:#4a90e2;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">重新加载</button>
      </div>
    `
  }
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('未捕获的 Promise 拒绝:', event.reason)
})

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
