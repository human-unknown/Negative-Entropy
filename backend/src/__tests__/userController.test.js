import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const mockReqRes = (overrides = {}) => {
  const req = { body: {}, query: {}, user: { id: 1 }, ...overrides }
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
  validateName,
  addExp,
  getUserDebates,
  getExpHistory,
  getLevelInfo,
} from '../controllers/userController.js'

// ===================== validateName（纯逻辑，无需数据库）=====================
describe('userController - validateName', () => {
  it('拒绝空姓名', () => {
    const { req, res } = mockReqRes({ body: { name: '' } })
    validateName(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('不能为空'))
  })

  it('拒绝缺失姓名字段', () => {
    const { req, res } = mockReqRes({ body: {} })
    validateName(req, res)
    assert.equal(res._json.code, 400)
  })

  it('通过常见真实姓氏：王小明', () => {
    const { req, res } = mockReqRes({ body: { name: '王小明' } })
    validateName(req, res)
    assert.equal(res._json.data.valid, true)
  })

  it('通过常见真实姓氏：李四', () => {
    const { req, res } = mockReqRes({ body: { name: '李四' } })
    validateName(req, res)
    assert.equal(res._json.data.valid, true)
  })

  it('拒绝非真实姓氏：小明', () => {
    const { req, res } = mockReqRes({ body: { name: '小明' } })
    validateName(req, res)
    assert.equal(res._json.data.valid, false)
    assert.ok(res._json.data.reason.includes('姓氏'))
  })

  it('拒绝包含数字：张三3', () => {
    const { req, res } = mockReqRes({ body: { name: '张三3' } })
    validateName(req, res)
    assert.equal(res._json.data.valid, false)
    assert.ok(res._json.data.reason.includes('数字'))
  })

  it('拒绝连续英文字母：张ABC', () => {
    const { req, res } = mockReqRes({ body: { name: '张ABC' } })
    validateName(req, res)
    assert.equal(res._json.data.valid, false)
    assert.ok(res._json.data.reason.includes('英文'))
  })

  it('拒绝特殊符号：张@伟', () => {
    const { req, res } = mockReqRes({ body: { name: '张@伟' } })
    validateName(req, res)
    assert.equal(res._json.data.valid, false)
    assert.ok(res._json.data.reason.includes('特殊符号'))
  })

  it('拒绝重复字符：张伟伟伟', () => {
    const { req, res } = mockReqRes({ body: { name: '张伟伟伟' } })
    validateName(req, res)
    assert.equal(res._json.data.valid, false)
    assert.ok(res._json.data.reason.includes('重复'))
  })

  it('拒绝 AAA 模式：王AAA', () => {
    const { req, res } = mockReqRes({ body: { name: '王AAA' } })
    validateName(req, res)
    assert.equal(res._json.data.valid, false)
  })

  it('拒绝过短姓名：刘', () => {
    const { req, res } = mockReqRes({ body: { name: '刘' } })
    validateName(req, res)
    assert.equal(res._json.data.valid, false)
    assert.ok(res._json.data.reason.includes('过短'))
  })

  it('拒绝过长姓名（>=10 字符）：王浩然张李刘陈杨赵周吴', () => {
    const { req, res } = mockReqRes({ body: { name: '王浩然张李刘陈杨赵周吴' } })
    validateName(req, res)
    assert.equal(res._json.data.valid, false)
    assert.ok(res._json.data.reason.includes('过长'))
  })

  it('自动 trim 空格', () => {
    const { req, res } = mockReqRes({ body: { name: '  王小明  ' } })
    validateName(req, res)
    assert.equal(res._json.data.valid, true)
  })
})

// ===================== addExp（需要数据库，测试参数校验）=====================
describe('userController - addExp', () => {
  it('拒绝缺少 exp 参数', async () => {
    const { req, res } = mockReqRes({ body: { userId: 1, source: 'debate' } })
    await addExp(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('参数不完整'))
  })

  it('拒绝缺少 userId 参数', async () => {
    const { req, res } = mockReqRes({ body: { exp: 10, source: 'debate' } })
    await addExp(req, res)
    assert.equal(res._json.code, 400)
  })

  it('拒绝缺少 source 参数', async () => {
    const { req, res } = mockReqRes({ body: { userId: 1, exp: 10 } })
    await addExp(req, res)
    assert.equal(res._json.code, 400)
  })
})

// ===================== getUserDebates（需要认证和数据库）=====================
describe('userController - getUserDebates', () => {
  it('数据库不可用时降级返回 500', async () => {
    const { req, res } = mockReqRes({ user: { id: 1 } })
    await getUserDebates(req, res)
    assert.equal(res._json.code, 500)
  })
})

// ===================== getExpHistory ======================
describe('userController - getExpHistory', () => {
  it('数据库不可用时降级返回 500', async () => {
    const { req, res } = mockReqRes({ user: { id: 1 } })
    await getExpHistory(req, res)
    assert.equal(res._json.code, 500)
  })

  it('带分页参数时数据库不可用降级', async () => {
    const { req, res } = mockReqRes({ user: { id: 1 }, query: { page: '1', limit: '10' } })
    await getExpHistory(req, res)
    assert.equal(res._json.code, 500)
  })
})

// ===================== getLevelInfo ======================
describe('userController - getLevelInfo', () => {
  it('数据库不可用时降级返回 500', async () => {
    const { req, res } = mockReqRes({ user: { id: 1 } })
    await getLevelInfo(req, res)
    assert.equal(res._json.code, 500)
  })
})
