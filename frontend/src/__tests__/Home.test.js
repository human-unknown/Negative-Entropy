import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock the router before importing component
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ query: {} })
}))

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('Home.vue', () => {
  it('shows login form when not logged in', async () => {
    localStorageMock.clear()
    const Home = await import('@/views/Home.vue')
    const wrapper = mount(Home.default)

    // Should show login form
    expect(wrapper.text()).toContain('登录')
    expect(wrapper.text()).toContain('注册账号')
    expect(wrapper.text()).toContain('管理员')

    // Should not show user section
    expect(wrapper.text()).not.toContain('欢迎回来')
  })

  it('shows user section when logged in', async () => {
    localStorageMock.setItem('token', 'mock-token')
    localStorageMock.setItem('user', JSON.stringify({
      id: 1,
      name: '测试用户',
      level: 2,
      exp: 150
    }))

    const Home = await import('@/views/Home.vue')
    const wrapper = mount(Home.default)

    // Wait for onMounted to execute
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('欢迎回来')
    expect(wrapper.text()).toContain('个人中心')
  })

  it('shows admin button for admin users', async () => {
    localStorageMock.setItem('token', 'admin-token')
    localStorageMock.setItem('user', JSON.stringify({
      id: 999,
      name: '管理员',
      level: 4,
      exp: 99999
    }))

    const Home = await import('@/views/Home.vue')
    const wrapper = mount(Home.default)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('管理后台')
  })

  it('shows create debate button for ADVANCED+ users', async () => {
    localStorageMock.setItem('token', 'mock-token')
    localStorageMock.setItem('user', JSON.stringify({
      id: 2,
      name: '资深用户',
      level: 3,
      exp: 2500
    }))

    const Home = await import('@/views/Home.vue')
    const wrapper = mount(Home.default)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('发起辩论')
  })
})
