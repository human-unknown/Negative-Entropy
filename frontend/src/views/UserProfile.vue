<template>
  <div class="profile-container">
    <div class="profile-header">
      <h1 class="profile-title">
        个人中心
      </h1>
    </div>

    <div class="profile-content">
      <aside class="profile-sidebar">
        <nav class="profile-nav">
          <ul class="nav-list">
            <li
              class="nav-item"
              :class="{ active: activeTab === 'info' }"
              @click="activeTab = 'info'"
            >
              <span class="nav-text">基本信息</span>
            </li>
            <li
              class="nav-item"
              :class="{ active: activeTab === 'debates' }"
              @click="activeTab = 'debates'"
            >
              <span class="nav-text">我的辩论</span>
            </li>
            <li
              class="nav-item"
              :class="{ active: activeTab === 'stats' }"
              @click="activeTab = 'stats'"
            >
              <span class="nav-text">数据统计</span>
            </li>
            <li
              class="nav-item"
              :class="{ active: activeTab === 'security' }"
              @click="activeTab = 'security'"
            >
              <span class="nav-text">账号安全</span>
            </li>
            <li
              class="nav-item"
              :class="{ active: activeTab === 'settings' }"
              @click="activeTab = 'settings'"
            >
              <span class="nav-text">系统设置</span>
            </li>
          </ul>
        </nav>
      </aside>

      <main class="profile-main">
        <div class="content-wrapper">
          <SecuritySettings v-if="activeTab === 'security'" />
          <div
            v-else
            class="placeholder"
          >
            {{ activeTab }} 功能开发中...
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SecuritySettings from '../components/SecuritySettings.vue'

const activeTab = ref('security')
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.profile-header {
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 1.5rem 2rem;
}

.profile-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.profile-content {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem;
}

.profile-sidebar {
  flex-shrink: 0;
  width: 240px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  height: fit-content;
}

.profile-nav {
  padding: 1rem 0;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  padding: 0.875rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: #f5f5f5;
}

.nav-item.active {
  background-color: #f0f7ff;
  border-left-color: #1976d2;
}

.nav-item.active .nav-text {
  color: #1976d2;
  font-weight: 500;
}

.nav-text {
  font-size: 0.9375rem;
  color: #333;
}

.profile-main {
  flex: 1;
  min-width: 0;
}

.content-wrapper {
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  padding: 2rem;
  min-height: 600px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .profile-header {
    padding: 1rem 1rem;
  }

  .profile-title {
    font-size: 1.25rem;
  }

  .profile-content {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }

  .profile-sidebar {
    width: 100%;
  }

  .profile-nav {
    padding: 0.5rem 0;
  }

  .nav-list {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .nav-item {
    flex-shrink: 0;
    padding: 0.75rem 1rem;
    border-left: none;
    border-bottom: 3px solid transparent;
  }

  .nav-item.active {
    border-left-color: transparent;
    border-bottom-color: #1976d2;
  }

  .nav-text {
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .content-wrapper {
    padding: 1rem;
    min-height: 400px;
  }
}

@media (max-width: 480px) {
  .profile-header {
    padding: 0.875rem 0.875rem;
  }

  .profile-title {
    font-size: 1.125rem;
  }

  .profile-content {
    padding: 0.75rem;
  }

  .nav-item {
    padding: 0.625rem 0.875rem;
  }

  .content-wrapper {
    padding: 0.875rem;
  }
}
</style>
