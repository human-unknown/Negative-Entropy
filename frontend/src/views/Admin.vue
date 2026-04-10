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
