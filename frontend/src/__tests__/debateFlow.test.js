import { describe, it, expect, beforeEach } from 'vitest'
import { mockApi } from '../api/mock.js'

describe('辩论流程端到端 Mock 测试', () => {
  beforeEach(() => {
    // 先登录管理员
    return mockApi.login({ account: '13900000001' })
  })

  it('创建辩论 → 列表中出现 → 查看详情', async () => {
    // 创建
    const createRes = await mockApi.createDebate({
      title: '测试辩论话题',
      description: '这是一个测试用的辩论',
      category: 'tech'
    })
    expect(createRes.code).toBe(200)
    const topicId = createRes.data.topicId

    // 列表应包含刚创建的
    const listRes = await mockApi.getDebateList({ page: 1, pageSize: 10 })
    expect(listRes.code).toBe(200)
    const found = listRes.data.list.find(d => d.id === topicId)
    expect(found).toBeTruthy()
    expect(found.title).toBe('测试辩论话题')

    // 查看详情
    const detailRes = await mockApi.getDebateDetail(topicId)
    expect(detailRes.code).toBe(200)
    expect(detailRes.data.title).toBe('测试辩论话题')
  })

  it('加入辩论 → 发言 → 投票', async () => {
    const topicId = 1

    // 加入正方
    const joinRes = await mockApi.joinDebate(topicId, 1)
    expect(joinRes.code).toBe(200)

    // 发言
    const speechRes = await mockApi.createSpeech(topicId, '这是正方的观点')
    expect(speechRes.code).toBe(200)

    // 获取发言列表
    const speechesRes = await mockApi.getSpeeches(topicId, 1)
    expect(speechesRes.code).toBe(200)
    expect(speechesRes.data.list.length).toBeGreaterThan(0)

    // 投票
    const voteRes = await mockApi.voteDebate(topicId, 1)
    expect(voteRes.code).toBe(200)
  })
})
