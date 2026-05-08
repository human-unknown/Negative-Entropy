<template>
  <div class="home-feed">
    <!-- 频道导航 -->
    <ChannelNav
      :channels="channels"
      :active="activeChannel"
      @select="handleChannelSelect"
    />

    <!-- 搜索 -->
    <div class="search-row">
      <el-input
        v-model="keyword"
        placeholder="搜索帖子..."
        :prefix-icon="Search"
        clearable
        class="search-input"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
    </div>

    <!-- 排序标签 -->
    <div class="sort-tabs">
      <span
        v-for="s in sorts"
        :key="s.value"
        :class="['sort-tab', { active: sort === s.value }]"
        @click="sort = s.value; loadPosts()"
      >
        {{ s.label }}
      </span>
    </div>

    <!-- 加载中 -->
    <el-skeleton
      v-if="loading"
      :rows="5"
      animated
    />

    <!-- 错误/空状态 -->
    <el-empty
      v-else-if="error"
      description="加载失败，请刷新重试"
    >
      <el-button type="primary" @click="loadPosts">重试</el-button>
    </el-empty>

    <el-empty
      v-else-if="!posts.length"
      description="暂无帖子，来发表第一个吧"
    />

    <!-- 帖子列表 -->
    <PostList
      v-else
      :posts="posts"
      :loading="false"
    />

    <!-- 加载更多 -->
    <div v-if="hasMore && posts.length" class="load-more">
      <el-button
        :loading="loadingMore"
        @click="loadMore"
      >
        加载更多
      </el-button>
    </div>

    <!-- 发帖按钮 (FAB) -->
    <el-button
      v-if="userStore.isLoggedIn && userStore.userLevel >= 2"
      type="primary"
      circle
      size="large"
      class="fab-btn"
      @click="$router.push('/p/create')"
    >
      <el-icon :size="22"><Plus /></el-icon>
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { getPosts } from '@/api/post'
import { getChannels } from '@/api/channel'
import { useUserStore } from '@/stores/user'
import ChannelNav from '@/components/ChannelNav.vue'
import PostList from '@/components/PostList.vue'

const userStore = useUserStore()

const posts = ref([])
const channels = ref([])
const activeChannel = ref('')
const keyword = ref('')
const sort = ref('quality')
const page = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
const error = ref(false)
const hasMore = ref(false)

const sorts = [
  { label: '质量优先', value: 'quality' },
  { label: '最新', value: 'newest' },
  { label: '最热', value: 'hot' }
]

const loadPosts = async (append = false) => {
  if (!append) {
    loading.value = true
    page.value = 1
  } else {
    loadingMore.value = true
  }
  error.value = false

  try {
    const params = {
      page: page.value,
      limit: 20,
      sort: sort.value
    }
    if (activeChannel.value) params.channel = activeChannel.value
    if (keyword.value) params.keyword = keyword.value

    const res = await getPosts(params)
    if (res.code === 200) {
      const data = res.data
      // normalize: API returns posts/items
      const list = data.posts || data.items || data.list || []
      if (append) {
        posts.value = [...posts.value, ...list]
      } else {
        posts.value = list
      }
      hasMore.value = data.hasMore ?? (list.length >= 20)
    } else {
      throw new Error(res.message)
    }
  } catch (err) {
    if (!append) error.value = true
    console.error('加载帖子失败:', err)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  page.value++
  loadPosts(true)
}

const handleChannelSelect = (slug) => {
  activeChannel.value = slug === activeChannel.value ? '' : slug
  loadPosts()
}

const handleSearch = () => {
  loadPosts()
}

const loadChannels = async () => {
  try {
    const res = await getChannels()
    if (res.code === 200) {
      channels.value = res.data || []
    }
  } catch (err) {
    console.error('加载频道失败:', err)
  }
}

onMounted(async () => {
  await loadChannels()
  await loadPosts()
})
</script>

<style scoped>
.home-feed {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.search-row {
  margin: 16px 0;
}

.search-input {
  max-width: 400px;
}

.sort-tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.sort-tab {
  font-size: 14px;
  color: #909399;
  cursor: pointer;
  padding-bottom: 4px;
  transition: color 0.2s;
}

.sort-tab:hover {
  color: #409EFF;
}

.sort-tab.active {
  color: #409EFF;
  border-bottom: 2px solid #409EFF;
}

.load-more {
  text-align: center;
  margin-top: 24px;
}

.fab-btn {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
  z-index: 100;
}

@media (max-width: 768px) {
  .home-feed {
    padding: 12px;
  }
  .fab-btn {
    bottom: 20px;
    right: 20px;
  }
}
</style>
