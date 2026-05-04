import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const mockReqRes = (overrides = {}) => {
  const req = {
    body: {},
    params: {},
    query: {},
    user: null,
    ...overrides
  }
  const res = {
    _json: null,
    json(data) {
      this._json = data
      return this
    }
  }
  return { req, res }
}

import { submitScore, getScoreResult } from '../controllers/scoreController.js'

describe('scoreController - submitScore', () => {

  it('returns 400 when scores is empty array', async () => {
    const { req, res } = mockReqRes({
      params: { topicId: '1' },
      body: { scores: [] },
      user: { userId: 1 }
    })
    await submitScore(req, res)
    assert.equal(res._json.code, 400)
    assert.equal(res._json.message, '评分数据不能为空')
  })

  it('returns 400 when scores is not an array', async () => {
    const { req, res } = mockReqRes({
      params: { topicId: '1' },
      body: { scores: 'invalid' },
      user: { userId: 1 }
    })
    await submitScore(req, res)
    assert.equal(res._json.code, 400)
    assert.equal(res._json.message, '评分数据不能为空')
  })

  it('returns 400 when score > 10', async () => {
    const { req, res } = mockReqRes({
      params: { topicId: '1' },
      body: {
        scores: [
          { targetStance: 1, criterionKey: 'argument', score: 11 }
        ]
      },
      user: { userId: 1 }
    })
    await submitScore(req, res)
    assert.equal(res._json.code, 400)
    assert.equal(res._json.message, '评分需在1-10之间')
  })

  it('returns 400 when score < 1', async () => {
    const { req, res } = mockReqRes({
      params: { topicId: '1' },
      body: {
        scores: [
          { targetStance: 1, criterionKey: 'argument', score: 0 }
        ]
      },
      user: { userId: 1 }
    })
    await submitScore(req, res)
    assert.equal(res._json.code, 400)
    assert.equal(res._json.message, '评分需在1-10之间')
  })

  it('returns 400 when targetStance is invalid', async () => {
    const { req, res } = mockReqRes({
      params: { topicId: '1' },
      body: {
        scores: [
          { targetStance: 2, criterionKey: 'argument', score: 5 }
        ]
      },
      user: { userId: 1 }
    })
    await submitScore(req, res)
    assert.equal(res._json.code, 400)
    assert.equal(res._json.message, '评分立场无效')
  })

  it('returns error when DB is unavailable', async () => {
    const { req, res } = mockReqRes({
      params: { topicId: '1' },
      body: {
        scores: [
          { targetStance: 1, criterionKey: 'argument', score: 5 }
        ]
      },
      user: { userId: 1 }
    })
    await submitScore(req, res)
    assert.equal(res._json.code, 500)
    assert.equal(res._json.message, '提交评分失败')
  })
})

describe('scoreController - getScoreResult', () => {

  it('returns error when DB is unavailable', async () => {
    const { req, res } = mockReqRes({
      params: { topicId: '1' }
    })
    await getScoreResult(req, res)
    assert.equal(res._json.code, 500)
    assert.equal(res._json.message, '获取评分结果失败')
  })
})
