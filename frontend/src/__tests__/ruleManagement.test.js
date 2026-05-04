import { describe, it, expect, beforeEach } from 'vitest'
import { mockApi } from '../api/mock.js'

describe('规则管理 Mock', () => {
  beforeEach(() => mockApi.login({ account: '13900000001' }))

  it('获取规则列表', async () => {
    const res = await mockApi.getRules()
    expect(res.code).toBe(200)
    expect(res.data.list.length).toBeGreaterThan(0)
    expect(res.data.list[0].title).toBeTruthy()
  })

  it('保存规则', async () => {
    const res = await mockApi.saveRule({ id: 1, title: '新标题', content: '新内容' })
    expect(res.code).toBe(200)
    // 验证更新生效
    const listRes = await mockApi.getRules()
    const updated = listRes.data.list.find(r => r.id === 1)
    expect(updated.title).toBe('新标题')
    expect(updated.version).toBe(3) // 从2升到3
  })

  it('发起规则辩论', async () => {
    const res = await mockApi.createRuleDebate({ ruleId: 1, proposal: '修改发言字数限制', reason: '当前限制不合理' })
    expect(res.code).toBe(200)
    expect(res.data.debateId).toBeGreaterThan(0)
  })
})
