import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// 临时替换 pool 为抛错模拟（无数据库环境）
const mockReqRes = (overrides = {}) => {
  const req = { body: {}, user: null, ...overrides }
  const res = {
    _json: null,
    json(data) {
      this._json = data
      return this
    }
  }
  return { req, res }
}

import { getRules, saveRule } from '../controllers/ruleController.js'

describe('ruleController - getRules', () => {

  it('returns error gracefully when DB is not available', async () => {
    const { req, res } = mockReqRes()
    await getRules(req, res)
    assert.equal(res._json.code, 500)
    assert.equal(res._json.message, '获取规则列表失败')
  })
})

describe('ruleController - saveRule', () => {

  it('returns 400 when title is missing', async () => {
    const { req, res } = mockReqRes({ body: { content: 'some rule text' } })
    await saveRule(req, res)
    assert.equal(res._json.code, 400)
    assert.equal(res._json.message, '标题和内容不能为空')
  })

  it('returns 400 when content is missing', async () => {
    const { req, res } = mockReqRes({ body: { title: '测试规则' } })
    await saveRule(req, res)
    assert.equal(res._json.code, 400)
    assert.equal(res._json.message, '标题和内容不能为空')
  })

  it('returns error gracefully when DB is not available (create)', async () => {
    const { req, res } = mockReqRes({ body: { title: '测试规则', content: '规则内容' } })
    await saveRule(req, res)
    assert.equal(res._json.code, 500)
    assert.equal(res._json.message, '保存规则失败')
  })

  it('returns error gracefully when DB is not available (update)', async () => {
    const { req, res } = mockReqRes({ body: { id: 1, title: '测试规则', content: '新内容' } })
    await saveRule(req, res)
    assert.equal(res._json.code, 500)
    assert.equal(res._json.message, '保存规则失败')
  })
})
