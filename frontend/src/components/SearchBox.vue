<template>
  <div class="search-box" ref="searchBoxRef">
    <div class="search-input-wrapper">
      <input
        v-model="searchKeyword"
        type="text"
        class="search-input"
        placeholder="搜索话题、用户..."
        @input="handleInput"
        @focus="showDropdown = true"
        @keydown.enter="handleSearch"
        @keydown.down.prevent="navigateDown"
        @keydown.up.prevent="navigateUp"
      />
      <button class="search-btn" @click="handleSearch">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
        </svg>
      </button>
    </div>

    <div v-if="showDropdown && (suggestions.length > 0 || loading)" class="search-dropdown">
      <div v-if="loading" class="dropdown-loading">搜索中...</div>
      <div v-else-if="suggestions.length === 0" class="dropdown-empty">暂无结果</div>
      <div
        v-else
        v-for="(item, index) in suggestions"
        :key="item.id"
        :class="['dropdown-item', { active: selectedIndex === index }]"
        @click="selectItem(item)"
        @mouseenter="selectedIndex = index"
      >
        <div class="item-title">{{ item.title }}</div>
        <div class="item-meta">
          <span class="item-category">{{ item.category }}</span>
          <span class="item-author">{{ item.publisher_name }}</span>
          <span class="item-heat">🔥 {{ item.heat }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../api/request'

const router = useRouter()
const searchBoxRef = ref(null)
const searchKeyword = ref('')
const suggestions = ref([])
const showDropdown = ref(false)
const loading = ref(false)
const selectedIndex = ref(-1)
let debounceTimer = null

const handleInput = () => {
  selectedIndex.value = -1
  
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  if (!searchKeyword.value.trim()) {
    suggestions.value = []
    showDropdown.value = false
    return
  }

  debounceTimer = setTimeout(() => {
    fetchSuggestions()
  }, 300)
}

const fetchSuggestions = async () => {
  if (!searchKeyword.value.trim()) return

  loading.value = true
  showDropdown.value = true

  try {
    const response = await request.get('/debate/search', {
      params: {
        keyword: searchKeyword.value,
        page: 1,
        pageSize: 5
      }
    })

    if (response.code === 200) {
      suggestions.value = response.data.list
    }
  } catch (error) {
    console.error('搜索失败:', error)
    suggestions.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (!searchKeyword.value.trim()) return

  showDropdown.value = false
  router.push({
    path: '/debate-list',
    query: { keyword: searchKeyword.value }
  })
}

const selectItem = (item) => {
  showDropdown.value = false
  router.push(`/debate/${item.id}`)
}

const navigateDown = () => {
  if (suggestions.value.length === 0) return
  selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length
}

const navigateUp = () => {
  if (suggestions.value.length === 0) return
  selectedIndex.value = selectedIndex.value <= 0 
    ? suggestions.value.length - 1 
    : selectedIndex.value - 1
}

const handleClickOutside = (event) => {
  if (searchBoxRef.value && !searchBoxRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<style scoped>
.search-box {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 24px;
  padding: 8px 12px;
  transition: all 0.3s;
}

.search-input-wrapper:focus-within {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  padding: 0 8px;
  background: transparent;
}

.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #1890ff;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s;
}

.search-btn:hover {
  background: #40a9ff;
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-loading,
.dropdown-empty {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover,
.dropdown-item.active {
  background: #f5f5f5;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.item-category {
  padding: 2px 8px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
}

.item-author::before {
  content: '👤 ';
}

.item-heat {
  margin-left: auto;
}
</style>
