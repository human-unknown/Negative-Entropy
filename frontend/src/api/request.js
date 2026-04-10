import axios from 'axios'
import { retry } from '../utils/optimize'
import { mockApi } from './mock'

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL.includes('localhost:3000')

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => response.data,
  async error => {
    if (USE_MOCK) {
      return handleMockRequest(error.config)
    }
    
    const status = error.response?.status
    
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    
    if (status === 403) {
      console.error('权限不足:', error.response?.data?.message || '无权访问')
      return Promise.reject(error)
    }
    
    if (error.code === 'ECONNABORTED' || !error.response) {
      try {
        return await retry(() => request(error.config), 2, 1000)
      } catch (retryError) {
        return Promise.reject(retryError)
      }
    }
    
    return Promise.reject(error)
  }
)

const handleMockRequest = async (config) => {
  const { method, url, data, params } = config
  
  if (url.includes('/auth/register')) return mockApi.register(data)
  if (url.includes('/auth/login')) return mockApi.login(data)
  if (url.includes('/debates') && method === 'get' && !url.includes('/topics/')) return mockApi.getDebateList(params)
  if (url.match(/\/debates\/topics\/\d+$/) && method === 'get') {
    const topicId = url.match(/\/topics\/(\d+)/)[1]
    return mockApi.getDebateDetail(topicId)
  }
  if (url.includes('/debates/topics') && method === 'post' && !url.includes('/join') && !url.includes('/speeches') && !url.includes('/vote')) return mockApi.createDebate(data)
  if (url.includes('/join')) {
    const topicId = url.match(/\/topics\/(\d+)/)[1]
    return mockApi.joinDebate(topicId, data.stance)
  }
  if (url.includes('/speeches') && method === 'get') {
    const topicId = url.match(/\/topics\/(\d+)/)[1]
    return mockApi.getSpeeches(topicId, params?.role)
  }
  if (url.includes('/speeches') && method === 'post') {
    const topicId = url.match(/\/topics\/(\d+)/)[1]
    return mockApi.createSpeech(topicId, data.content)
  }
  if (url.includes('/vote')) {
    const topicId = url.match(/\/topics\/(\d+)/)[1]
    return mockApi.voteDebate(topicId, data.stance)
  }
  if (url.includes('/user/profile')) return mockApi.getUserInfo()
  if (url.includes('/check/logic-test') && method === 'get') return mockApi.getLogicTest()
  if (url.includes('/check/logic-test') && method === 'post') return mockApi.submitLogicTest(data)
  if (url.includes('/check/debate-topic')) return mockApi.getDebateTopic()
  if (url.includes('/check/debate') && method === 'post') return mockApi.submitDebateTest(data)
  if (url.includes('/check/result/')) {
    const userId = url.match(/\/result\/(\d+)/)?.[1]
    return mockApi.getCheckResult(userId)
  }
  
  return { code: 200, data: {}, message: 'Mock响应' }
}

export default request
