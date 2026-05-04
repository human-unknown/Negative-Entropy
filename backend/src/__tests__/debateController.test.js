import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const mockReqRes = (overrides = {}) => {
  const req = { body: {}, query: {}, user: null, ...overrides }
  const res = {
    _json: null,
    json(data) {
      this._json = data
      return this
    }
  }
  return { req, res }
}

// 只测试不需要数据库连接即能验证的函数
// createTopic / joinTopic 等需要 DB 交互的函数由集成测试覆盖
import {
  searchTopics,
  getCategories
} from '../controllers/debateController.js'

describe('debateController - searchTopics', () => {

  it('returns error gracefully when DB is not available', async () => {
    const { req, res } = mockReqRes({ query: { keyword: 'AI' } })
    await searchTopics(req, res)
    assert.equal(res._json.code, 500)
    assert.equal(res._json.message, '搜索失败')
  })

  it('handles empty query gracefully', async () => {
    const { req, res } = mockReqRes({ query: {} })
    await searchTopics(req, res)
    assert.equal(res._json.code, 500)
  })

  it('handles sort parameter gracefully', async () => {
    const { req, res } = mockReqRes({ query: { sort: 'heat', page: '1', pageSize: '5' } })
    await searchTopics(req, res)
    assert.equal(res._json.code, 500)
  })
})

describe('debateController - getCategories', () => {

  it('returns error gracefully when DB is not available', async () => {
    const { req, res } = mockReqRes()
    await getCategories(req, res)
    assert.equal(res._json.code, 500)
    assert.equal(res._json.message, '获取分类失败')
  })
})
