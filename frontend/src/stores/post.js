import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePostStore = defineStore('post', () => {
  // 首页帖子列表缓存
  const feedPosts = ref([])
  const feedPage = ref(1)
  const feedHasMore = ref(false)

  // 当前查看的帖子
  const currentPost = ref(null)

  // 评论缓存
  const comments = ref([])

  // 频道列表缓存
  const channels = ref([])

  // Setters
  function setFeedPosts(posts, page = 1, hasMore = false) {
    feedPosts.value = posts
    feedPage.value = page
    feedHasMore.value = hasMore
  }

  function appendFeedPosts(posts, page, hasMore) {
    feedPosts.value = [...feedPosts.value, ...posts]
    feedPage.value = page
    feedHasMore.value = hasMore
  }

  function setCurrentPost(post) {
    currentPost.value = post
  }

  function updateCurrentPost(partial) {
    if (currentPost.value) {
      Object.assign(currentPost.value, partial)
    }
  }

  function setComments(list) {
    comments.value = list
  }

  function setChannels(list) {
    channels.value = list
  }

  function clearFeed() {
    feedPosts.value = []
    feedPage.value = 1
    feedHasMore.value = false
  }

  return {
    feedPosts,
    feedPage,
    feedHasMore,
    currentPost,
    comments,
    channels,
    setFeedPosts,
    appendFeedPosts,
    setCurrentPost,
    updateCurrentPost,
    setComments,
    setChannels,
    clearFeed
  }
})
