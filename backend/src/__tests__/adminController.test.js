import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const mockReqRes = (overrides = {}) => {
  const req = { body: {}, query: {}, params: {}, user: null, ...overrides }
  const res = {
    _json: null,
    json(data) {
      this._json = data
      return this
    },
  }
  return { req, res }
}

import {
  punishUser,
  restoreUser,
  searchUsers,
  getUserDetail,
  getPendingTopics,
  reviewTopic,
  getAIErrors,
  submitAIOptimization,
  getStats,
} from '../controllers/adminController.js'

// ===================== punishUser（测试参数校验）=====================
describe('adminController - punishUser', () => {
  it('拒绝缺少 userId', async () => {
    const { req, res } = mockReqRes({ body: { type: 1, reason: '违规' }, user: { id: 99 } })
    await punishUser(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('参数不完整'))
  })

  it('拒绝缺少 type', async () => {
    const { req, res } = mockReqRes({ body: { userId: 1, reason: '违规' }, user: { id: 99 } })
    await punishUser(req, res)
    assert.equal(res._json.code, 400)
  })

  it('拒绝缺少 reason', async () => {
    const { req, res } = mockReqRes({ body: { userId: 1, type: 1 }, user: { id: 99 } })
    await punishUser(req, res)
    assert.equal(res._json.code, 400)
  })

  it('拒绝无效的处罚类型', async () => {
    const { req, res } = mockReqRes({
      body: { userId: 1, type: 99, reason: '违规' },
      user: { id: 99 },
    })
    await punishUser(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('无效'))
  })

  it('数据库不可用时降级', async () => {
    const { req, res } = mockReqRes({
      body: { userId: 99999, type: 1, reason: '测试警告' },
      user: { id: 99 },
    })
    await punishUser(req, res)
    // 用户不存在 → 404 或 数据库不可用 → 500
    assert.ok([404, 500].includes(res._json.code))
  })
})

// ===================== restoreUser（测试参数校验）=====================
describe('adminController - restoreUser', () => {
  it('拒绝缺少 userId', async () => {
    const { req, res } = mockReqRes({ body: {}, user: { id: 99 } })
    await restoreUser(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('不能为空'))
  })

  it('数据库不可用时降级', async () => {
    const { req, res } = mockReqRes({ body: { userId: 99999 }, user: { id: 99 } })
    await restoreUser(req, res)
    assert.ok([404, 500].includes(res._json.code))
  })
})

// ===================== searchUsers（测试参数校验）=====================
describe('adminController - searchUsers', () => {
  it('拒绝空搜索词', async () => {
    const { req, res } = mockReqRes({ query: { query: '' } })
    await searchUsers(req, res)
    assert.equal(res._json.code, 400)
  })

  it('拒绝缺失搜索词', async () => {
    const { req, res } = mockReqRes({ query: {} })
    await searchUsers(req, res)
    assert.equal(res._json.code, 400)
  })

  it('数据库不可用时降级', async () => {
    const { req, res } = mockReqRes({ query: { query: 'test' } })
    await searchUsers(req, res)
    assert.equal(res._json.code, 500)
  })
})

// ===================== getUserDetail（测试参数校验）=====================
describe('adminController - getUserDetail', () => {
  it('拒绝缺失 userId', async () => {
    const { req, res } = mockReqRes({ params: {} })
    await getUserDetail(req, res)
    assert.equal(res._json.code, 400)
  })

  it('数据库不可用时降级', async () => {
    const { req, res } = mockReqRes({ params: { userId: '99999' } })
    await getUserDetail(req, res)
    assert.equal(res._json.code, 500)
  })
})

// ===================== reviewTopic（测试参数校验）=====================
describe('adminController - reviewTopic', () => {
  it('拒绝缺少 topicId', async () => {
    const { req, res } = mockReqRes({ body: { action: 'approve' }, user: { id: 99 } })
    await reviewTopic(req, res)
    assert.equal(res._json.code, 400)
  })

  it('拒绝缺少 action', async () => {
    const { req, res } = mockReqRes({ body: { topicId: 1 }, user: { id: 99 } })
    await reviewTopic(req, res)
    assert.equal(res._json.code, 400)
  })

  it('reject 时必须填写理由', async () => {
    const { req, res } = mockReqRes({
      body: { topicId: 1, action: 'reject' },
      user: { id: 99 },
    })
    await reviewTopic(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('理由'))
  })
})

// ===================== submitAIOptimization（测试参数校验）=====================
describe('adminController - submitAIOptimization', () => {
  it('拒绝空 labels', async () => {
    const { req, res } = mockReqRes({ body: { labels: [] }, user: { id: 99 } })
    await submitAIOptimization(req, res)
    assert.equal(res._json.code, 400)
  })

  it('拒绝非数组 labels', async () => {
    const { req, res } = mockReqRes({ body: { labels: 'not-array' }, user: { id: 99 } })
    await submitAIOptimization(req, res)
    assert.equal(res._json.code, 400)
  })
})

// ===================== getStats / getPendingTopics / getAIErrors ======================
describe('adminController - 降级测试', () => {
  it('getPendingTopics 数据库不可用时降级', async () => {
    const { req, res } = mockReqRes()
    await getPendingTopics(req, res)
    assert.equal(res._json.code, 500)
  })

  it('getAIErrors 数据库不可用时降级', async () => {
    const { req, res } = mockReqRes()
    await getAIErrors(req, res)
    assert.equal(res._json.code, 500)
  })

  it('getStats 数据库不可用时降级', async () => {
    const { req, res } = mockReqRes()
    await getStats(req, res)
    assert.equal(res._json.code, 500)
  })
})
