<template>
  <div class="app-layout">
    <nav class="nav-bar">
      <div class="nav-left">
        <router-link
          to="/debates"
          class="logo"
        >
          逆熵
        </router-link>
        <div class="nav-search">
          <SearchBox />
        </div>
      </div>
      <div class="nav-tabs">
        <router-link
          v-for="tab in navTabs"
          :key="tab.path"
          :to="tab.path"
          class="nav-tab"
          :class="{ active: isActive(tab.path) }"
        >
          {{ tab.label }}
        </router-link>
      </div>
      <div class="nav-right">
        <NotificationBell />
        <UserDropdownMenu />
      </div>
    </nav>
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import SearchBox from '@/components/SearchBox.vue'
import NotificationBell from '@/components/NotificationBell.vue'
import UserDropdownMenu from '@/components/UserDropdownMenu.vue'

const route = useRoute()

const navTabs = [
  { path: '/debates', label: '辩论列表' },
  { path: '/rules', label: '规则辩论' },
  { path: '/check/logic', label: '逻辑测试' }
]

const isActive = (path) => {
  return route.path.startsWith(path)
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #f5f5f5;
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 24px;
  z-index: 1000;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  text-decoration: none;
  letter-spacing: 1px;
}

.nav-search {
  width: 320px;
}

.nav-tabs {
  flex: 1;
  display: flex;
  gap: 4px;
  justify-content: center;
}

.nav-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-tab:hover {
  background: #f5f5f5;
  color: #333;
}

.nav-tab.active {
  background: #e8f0fe;
  color: #1967d2;
  font-weight: 500;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.main-content {
  padding-top: 64px;
  min-height: calc(100vh - 64px);
}

@media (max-width: 768px) {
  .nav-bar {
    padding: 0 12px;
    gap: 12px;
  }

  .nav-search {
    display: none;
  }

  .nav-tabs {
    justify-content: flex-start;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .nav-tab {
    flex-shrink: 0;
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
