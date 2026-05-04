<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <h2>管理后台</h2>
      </div>
      <nav class="sidebar-menu">
        <div
          v-for="item in menuItems"
          :key="item.key"
          :class="['menu-item', { active: activeMenu === item.key }]"
          @click="activeMenu = item.key"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
        </div>
        <div class="sidebar-footer">
          <button
            class="shutdown-btn"
            @click="handleShutdown"
          >
            ⏻ 关闭服务
          </button>
        </div>
      </nav>
    </aside>
    <main class="admin-main">
      <header class="admin-header">
        <h1>{{ currentMenuLabel }}</h1>
      </header>
      <div class="admin-content">
        <AdminUserManagement v-if="activeMenu === 'users'" />
        <AdminContentReview v-else-if="activeMenu === 'content'" />
        <AdminManualReview v-else-if="activeMenu === 'review'" />
        <AdminRuleManagement v-else-if="activeMenu === 'rules'" />
        <AdminDataStats v-else-if="activeMenu === 'stats'" />
        <AdminAIOptimization v-else-if="activeMenu === 'ai'" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import AdminUserManagement from '@/components/AdminUserManagement.vue'
import AdminContentReview from '@/components/AdminContentReview.vue'
import AdminManualReview from '@/components/AdminManualReview.vue'
import AdminRuleManagement from '@/components/AdminRuleManagement.vue'
import AdminDataStats from '@/components/AdminDataStats.vue'
import AdminAIOptimization from '@/components/AdminAIOptimization.vue'

const activeMenu = ref('users')

const menuItems = [
  { key: 'users', label: '用户管理', icon: '👥' },
  { key: 'content', label: '内容管理', icon: '📝' },
  { key: 'review', label: '人工复核', icon: '🔍' },
  { key: 'rules', label: '规则管理', icon: '⚖️' },
  { key: 'stats', label: '数据统计', icon: '📊' },
  { key: 'ai', label: 'AI模型优化', icon: '🤖' }
]

const currentMenuLabel = computed(() => {
  return menuItems.find(item => item.key === activeMenu.value)?.label || ''
})

const handleShutdown = async () => {
  try {
    await ElMessageBox.confirm('确定要关闭整个服务？\n后端服务器将停止运行，前端页面将关闭。', '警告', { type: 'warning', confirmButtonText: '确认关闭', cancelButtonText: '取消' })
  } catch {
    return
  }

  try {
    await fetch('/api/system/shutdown', { method: 'POST' })
  } catch (_) {
    // 响应回来之前后端就已经停了，正常
  }

  // 关闭当前页面
  window.close()
  // 如果 window.close 被浏览器阻止（常见于非脚本打开的页面），
  // 给出提示
  setTimeout(() => {
    document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-size:18px;color:#999">服务已关闭，请关闭此标签页</div>'
  }, 500)
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
}

.admin-sidebar {
  width: 240px;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.sidebar-menu {
  flex: 1;
  padding: 16px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.3s;
  color: rgba(255, 255, 255, 0.7);
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.menu-item.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-left: 3px solid #4a90e2;
}

.menu-icon {
  font-size: 20px;
  margin-right: 12px;
}

.menu-label {
  font-size: 15px;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.shutdown-btn {
  width: 100%;
  padding: 10px;
  border: 1px solid rgba(255, 76, 76, 0.5);
  background: transparent;
  color: #ff4c4c;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.shutdown-btn:hover {
  background: #ff4c4c;
  color: #fff;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  background: #fff;
  padding: 20px 32px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.admin-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.admin-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}

.content-placeholder {
  background: #fff;
  padding: 40px;
  border-radius: 8px;
  text-align: center;
  color: #999;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
