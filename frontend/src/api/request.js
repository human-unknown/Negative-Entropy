import axios from 'axios'
import { mockApi } from './mock'

// Mock 模式：通过环境变量 VITE_USE_MOCK 控制
// 开发环境默认开启 Mock，生产环境关闭
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// 从 URL 中提取相对路径
const getRelativePath = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) {
    const idx = url.indexOf('/api')
    return idx >= 0 ? url.substring(idx) : url
  }
  return url
}

const handleMockRequest = ({ method, url, data, params }) => {
  const path = getRelativePath(url)

  // ---- 结构化辩论轮次 & 评分 ----
  if (path.includes('/current-round') && method === 'get') return mockApi.getCurrentRound()
  if (path.includes('/rounds') && method === 'get') return mockApi.getRounds()
  if (path.includes('/rounds') && method === 'post' && path.includes('/submit')) return mockApi.submitRound(data)
  if (path.includes('/rounds') && method === 'post' && path.includes('/skip')) return mockApi.skipRound()
  if (path.includes('/score-result') && method === 'get') return mockApi.getScoreResult()
  if (path.includes('/score') && method === 'post') return mockApi.submitScore(data)

  // ---- 认证 ----
  if (path.includes('/auth/register')) return mockApi.register(data)
  if (path.includes('/auth/login')) return mockApi.login(data)

  // ---- 社区功能（频道 / 帖子 / 评论）----
  if (path.includes('/channels') && method === 'get') return mockApi.getChannels()
  if (path.includes('/posts') && path.includes('/comments') && method === 'get') {
    const postId = path.match(/\/posts\/(\d+)\/comments/)[1]
    return mockApi.getComments(postId, params)
  }
  if (path.includes('/posts') && path.includes('/comments') && method === 'post') {
    const postId = path.match(/\/posts\/(\d+)\/comments/)[1]
    return mockApi.createComment(postId, data)
  }
  if (path.includes('/comments') && path.includes('/upvote') && method === 'post') {
    const commentId = path.match(/\/comments\/(\d+)/)[1]
    return mockApi.upvoteComment(commentId)
  }
  if (path.includes('/comments') && method === 'delete') {
    const commentId = path.match(/\/comments\/(\d+)/)[1]
    return mockApi.deleteComment(commentId)
  }
  if (path.includes('/posts') && path.includes('/pin') && method === 'post') {
    const postId = path.match(/\/posts\/(\d+)/)[1]
    return mockApi.togglePin(postId)
  }
  if (path.includes('/posts') && path.includes('/debate') && method === 'post') {
    const postId = path.match(/\/posts\/(\d+)/)[1]
    return mockApi.startDebateFromPost(postId)
  }
  if (path.includes('/posts') && path.includes('/score') && method === 'post') {
    const postId = path.match(/\/posts\/(\d+)/)[1]
    return mockApi.scorePost(postId, data)
  }
  if (path.match(/\/posts\/\d+$/) && method === 'get') {
    const postId = path.match(/\/posts\/(\d+)/)[1]
    return mockApi.getPostDetail(postId)
  }
  if (path.match(/\/posts\/\d+$/) && method === 'put') {
    const postId = path.match(/\/posts\/(\d+)/)[1]
    return mockApi.updatePost(postId, data)
  }
  if (path.match(/\/posts\/\d+$/) && method === 'delete') {
    return mockApi.deletePost()
  }
  if (path.includes('/posts') && method === 'get') return mockApi.getPosts(params)
  if (path.includes('/posts') && method === 'post') return mockApi.createPost(data)

  // ---- 用户数据（必须在 /debate 之前，否则 /user/debates 被 /debate 误抢） ----
  if (path.includes('/user/debates')) return mockApi.getUserDebates(params)
  if (path.includes('/user/exp')) return mockApi.getExpHistory(params)
  if (path.includes('/user/level')) return mockApi.getLevelInfo()
  if (path.includes('/user/profile')) return mockApi.getUserInfo()

  // ---- 辩论相关 ----
  if (path.includes('/debate') || path.includes('/debates')) {
    if (path.includes('/join')) {
      const topicId = path.match(/\/topics\/(\d+)/)[1]
      return mockApi.joinDebate(topicId, data.stance)
    }
    if (path.includes('/vote')) {
      const topicId = path.match(/\/topics\/(\d+)/)[1]
      return mockApi.voteDebate(topicId, data.stance)
    }
    if (method === 'get') {
      // /debate/topics/:id → getDebateDetail
      if (path.match(/\/topics\/\d+$/)) {
        const topicId = path.match(/\/topics\/(\d+)/)[1]
        return mockApi.getDebateDetail(topicId)
      }
      // /debate/topics/:id/speeches → getSpeeches
      if (path.includes('/speeches')) {
        const topicId = path.match(/\/topics\/(\d+)/)[1]
        return mockApi.getSpeeches(topicId, params?.role)
      }
      // /debates (列表) → getDebateList
      return mockApi.getDebateList(params)
    }
    if (method === 'post') {
      if (path.includes('/speeches')) {
        const topicId = path.match(/\/topics\/(\d+)/)[1]
        const isAudience = path.includes('/audience-speeches')
        if (isAudience) {
          return mockApi.createSpeech(topicId, data.content)
        }
        return mockApi.createSpeech(topicId, data.content)
      }
      return mockApi.createDebate(data)
    }
  }

  // ---- 逻辑测试 ----
  if (path.includes('/check/logic-test') && method === 'get') return mockApi.getLogicTest()
  if (path.includes('/check/logic-test') && method === 'post') return mockApi.submitLogicTest(data)
  if (path.includes('/check/debate-topic')) return mockApi.getDebateTopic()
  if (path.includes('/check/debate') && method === 'post') return mockApi.submitDebateTest(data)
  if (path.includes('/check/result/')) {
    const userId = path.match(/\/result\/(\d+)/)?.[1]
    return mockApi.getCheckResult(userId)
  }

  // ---- 规则管理 ----
  if (path.includes('/rules') || path.includes('/rule-debates')) {
    if (path.includes('/rules') && method === 'get') return mockApi.getRules()
    if (path.includes('/rules') && (method === 'post' || method === 'put')) return mockApi.saveRule(data)
    if (path.includes('/rule-debates') && method === 'post') return mockApi.createRuleDebate(data)
    return { code: 200, data: {}, message: '规则操作成功' }
  }

  // ---- 通知系统 ----
  if (path.includes('/notification/unread-count')) return mockApi.getUnreadCount()
  if (path.includes('/notification') && method === 'get') return mockApi.getNotifications(params)
  if (path.match(/\/notification\/\d+\/read/) && method === 'put') {
    const id = path.match(/\/notification\/(\d+)/)[1]
    return mockApi.markAsRead(id)
  }
  if (path.includes('/notification/read-all') && method === 'put') return mockApi.markAllAsRead()

  // ---- 兜底 ----
  return { code: 200, data: {}, message: 'Mock响应' }
}

// Mock 模式：纯对象，不经过 axios 任何内部管道
// 非 Mock 模式：真实 axios 实例
let request
if (USE_MOCK) {
  request = {
    get: async (url, config) => handleMockRequest({ method: 'get', url, data: null, params: config?.params }),
    post: async (url, data) => handleMockRequest({ method: 'post', url, data, params: null }),
    put: async (url, data) => handleMockRequest({ method: 'put', url, data, params: null })
  }
} else {
  const r = axios.create({ baseURL: '/api', timeout: 10000 })
  r.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
  r.interceptors.response.use(
    response => response.data,
    error => {
      const status = error.response?.status
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/'
        return Promise.reject(error)
      }
      if (status === 403) {
        console.error('权限不足:', error.response?.data?.message || '无权访问')
        return Promise.reject(error)
      }
      return Promise.reject(error)
    }
  )
  request = r
}

export default request
