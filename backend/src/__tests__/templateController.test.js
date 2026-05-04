import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

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

import { getTemplates, getTemplateDetail, createTemplate } from '../controllers/templateController.js'

describe('templateController - getTemplates', () => {

  it('returns error gracefully when DB is not available', async () => {
    const { req, res } = mockReqRes()
    await getTemplates(req, res)
    assert.equal(res._json.code, 500)
    assert.equal(res._json.message, '获取模板列表失败')
  })
})

describe('templateController - getTemplateDetail', () => {

  it('returns error gracefully when DB is not available', async () => {
    const { req, res } = mockReqRes({ params: { id: '1' } })
    await getTemplateDetail(req, res)
    assert.equal(res._json.code, 500)
    assert.equal(res._json.message, '获取模板详情失败')
  })
})

describe('templateController - createTemplate', () => {

  it('returns 400 when name is missing', async () => {
    const { req, res } = mockReqRes({ body: { type: 'standard', config: '{}' } })
    await createTemplate(req, res)
    assert.equal(res._json.code, 400)
    assert.equal(res._json.message, '模板名称不能为空')
  })

  it('returns 400 when type is missing', async () => {
    const { req, res } = mockReqRes({ body: { name: '标准辩论', config: '{}' } })
    await createTemplate(req, res)
    assert.equal(res._json.code, 400)
    assert.equal(res._json.message, '模板类型不能为空')
  })

  it('returns 400 when config is missing', async () => {
    const { req, res } = mockReqRes({ body: { name: '标准辩论', type: 'standard' } })
    await createTemplate(req, res)
    assert.equal(res._json.code, 400)
    assert.equal(res._json.message, '模板配置不能为空')
  })

  it('returns error gracefully when DB is not available', async () => {
    const { req, res } = mockReqRes({ body: { name: '标准辩论', type: 'standard', config: '{}' } })
    await createTemplate(req, res)
    assert.equal(res._json.code, 500)
    assert.equal(res._json.message, '创建模板失败')
  })
})
