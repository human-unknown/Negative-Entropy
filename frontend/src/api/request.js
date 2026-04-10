import axios from 'axios'
import { retry } from '../utils/optimize'

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

export default request
