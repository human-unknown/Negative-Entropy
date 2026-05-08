<template>
  <div class="channel-view">
    <!-- 加载中 -->
    <el-skeleton v-if="loading" :rows="5" animated />

    <!-- 频道不存在 -->
    <el-empty
      v-else-if="!channel"
      description="频道不存在"
    >
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </el-empty>

    <!-- 频道内容 -->
    <template v-else>
      <!-- 频道头部 -->
      <div class="channel-header">
        <div class="channel-info">
          <span class="channel-icon">{{ channel.icon }}</span>
          <div>
            <h2 class="channel-name">{{ channel.name }}</h2>
            <p class="channel-desc">{{ channel.description }}</p>
          </div>
        </div>
        <span class="post-count">{{ channel.post_count || 0 }} 篇帖子</span>
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

      <!-- 帖子列表 -->
      <PostList
        v-if="!postLoading && posts.length"
        :posts="posts"
        :loading="false"
      />

      <el-empty
        v-else-if="!postLoading"
        description="该频道暂无帖子"
      />

      <el-skeleton
        v-else
        :rows="4"
        animated
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
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getPosts } from '@/api/post'
import { getChannels } from '@/api/channel'
import PostList from '@/components/PostList.vue'

const route = useRoute()

const channels = ref([])
const posts = ref([])
const loading = ref(true)
const postLoading = ref(false)
const loadingMore = ref(false)
const sort = ref('quality')
const page = ref(1)
const hasMore = ref(false)

const sorts = [
  { label: '质量优先', value: 'quality' },
  { label: '最新', value: 'newest' },
  { label: '最热', value: 'hot' }
]

const channel = computed(() =>
  channels.value.find(c => c.slug === route.params.slug)
)

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

const loadPosts = async (append = false) => {
  if (!append) {
    postLoading.value = true
    page.value = 1
  } else {
    loadingMore.value = true
  }

  try {
    const params = {
      channel: route.params.slug,
      page: page.value,
      limit: 20,
      sort: sort.value
    }

    const res = await getPosts(params)
    if (res.code === 200) {
      const data = res.data
      const list = data.posts || data.items || data.list || []
      if (append) {
        posts.value = [...posts.value, ...list]
      } else {
        posts.value = list
      }
      hasMore.value = data.hasMore ?? (list.length >= 20)
    }
  } catch (err) {
    console.error('加载帖子失败:', err)
  } finally {
    postLoading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  page.value++
  loadPosts(true)
}

// 监听路由参数变化
watch(() => route.params.slug, () => {
  if (channel.value) {
    loading.value = false
    loadPosts()
  }
})

onMounted(async () => {
  await loadChannels()
  loading.value = false
  if (channel.value) {
    await loadPosts()
  }
})
</script>

<style scoped>
.channel-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.channel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.channel-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.channel-icon {
  font-size: 36px;
}

.channel-name {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 4px;
}

.channel-desc {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.post-count {
  font-size: 14px;
  color: #909399;
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

@media (max-width: 768px) {
  .channel-view {
    padding: 12px;
  }
}
</style>
