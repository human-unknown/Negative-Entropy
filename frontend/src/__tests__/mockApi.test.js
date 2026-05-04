import { describe, it, expect } from 'vitest'
import { mockApi } from '../api/mock.js'

describe('mockApi.login', () => {
  it('管理员账号 13900000001 登录成功', async () => {
    const res = await mockApi.login({ account: '13900000001' })
    expect(res.code).toBe(200)
    expect(res.data.user.name).toBe('管理员')
    expect(res.data.user.level).toBe(4)
    expect(res.data.token).toContain('mock-token')
  })

  it('不存在的账号自动注册为测试用户', async () => {
    const res = await mockApi.login({ account: '18800000000' })
    expect(res.code).toBe(200)
    expect(res.data.user.name).toBe('测试用户')
    expect(res.data.user.level).toBe(2)
  })
})

describe('mockApi.register', () => {
  it('注册返回 userId', async () => {
    const res = await mockApi.register({ name: '测试', phone: '18800000001' })
    expect(res.code).toBe(200)
    expect(res.data.userId).toBeGreaterThan(0)
  })
})

describe('mockApi.getDebateList', () => {
  it('返回辩论列表且总数正确', async () => {
    const res = await mockApi.getDebateList({ page: 1, pageSize: 10 })
    expect(res.code).toBe(200)
    expect(Array.isArray(res.data.list)).toBe(true)
    expect(res.data.total).toBeGreaterThan(0)
  })
})

describe('mockApi.createSpeech', () => {
  it('发言成功后返回内容', async () => {
    const res = await mockApi.createSpeech(1, '测试发言内容')
    expect(res.code).toBe(200)
    expect(res.data.content).toBe('测试发言内容')
  })
})

describe('mockApi.voteDebate', () => {
  it('投票成功', async () => {
    const res = await mockApi.voteDebate(1, 1)
    expect(res.code).toBe(200)
  })
})
