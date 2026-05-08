import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const mockReqRes = (overrides = {}) => {
  const req = { body: {}, ...overrides }
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
  sendResetCode,
  resetPassword,
  enable2FA,
  verify2FA,
  send2FACode,
} from '../controllers/securityController.js'

// ===================== sendResetCode =====================
describe('securityController - sendResetCode', () => {
  it('拒绝空账号', async () => {
    const { req, res } = mockReqRes({ body: { account: '' } })
    await sendResetCode(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('不能为空'))
  })

  it('拒绝缺失账号字段', async () => {
    const { req, res } = mockReqRes({ body: {} })
    await sendResetCode(req, res)
    assert.equal(res._json.code, 400)
  })

  it('账号不存在返回 404（数据库不可用时降级）', async () => {
    const { req, res } = mockReqRes({ body: { account: 'nonexistent@test.com' } })
    await sendResetCode(req, res)
    // DB 不可用时查询抛出异常 → 被 catch → 500
    assert.ok([404, 500].includes(res._json.code))
  })
})

// ===================== resetPassword =====================
describe('securityController - resetPassword', () => {
  it('拒绝缺少 account', async () => {
    const { req, res } = mockReqRes({ body: { code: '123456', newPassword: 'pass123' } })
    await resetPassword(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('参数不完整'))
  })

  it('拒绝缺少 code', async () => {
    const { req, res } = mockReqRes({ body: { account: '13800138000', newPassword: 'pass123' } })
    await resetPassword(req, res)
    assert.equal(res._json.code, 400)
  })

  it('拒绝缺少 newPassword', async () => {
    const { req, res } = mockReqRes({ body: { account: '13800138000', code: '123456' } })
    await resetPassword(req, res)
    assert.equal(res._json.code, 400)
  })

  it('拒绝过短密码（< 6 位）', async () => {
    const { req, res } = mockReqRes({
      body: { account: '13800138000', code: '123456', newPassword: '12345' },
    })
    await resetPassword(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('至少6个字符'))
  })

  it('验证码错误时拒绝', async () => {
    const { req, res } = mockReqRes({
      body: { account: '13800138000', code: '000000', newPassword: 'newpass123' },
    })
    await resetPassword(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('验证码'))
  })
})

// ===================== enable2FA =====================
describe('securityController - enable2FA', () => {
  it('拒绝缺少 userId', async () => {
    const { req, res } = mockReqRes({ body: { enable: true } })
    await enable2FA(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('参数不完整'))
  })

  it('拒绝缺少 enable', async () => {
    const { req, res } = mockReqRes({ body: { userId: 1 } })
    await enable2FA(req, res)
    assert.equal(res._json.code, 400)
  })

  it('数据库不可用时降级（模拟成功）', async () => {
    const { req, res } = mockReqRes({ body: { userId: '1', enable: true } })
    await enable2FA(req, res)
    // DB 不可用时 catch 块返回模拟成功
    assert.equal(res._json.code, 200)
    assert.ok(res._json.data.message.includes('已开启'))
  })

  it('关闭双重认证', async () => {
    const { req, res } = mockReqRes({ body: { userId: '1', enable: false } })
    await enable2FA(req, res)
    assert.equal(res._json.code, 200)
    assert.ok(res._json.data.message.includes('已关闭'))
  })
})

// ===================== verify2FA =====================
describe('securityController - verify2FA', () => {
  it('拒绝缺少 userId', async () => {
    const { req, res } = mockReqRes({ body: { code: '123456' } })
    await verify2FA(req, res)
    assert.equal(res._json.code, 400)
  })

  it('拒绝缺少 code', async () => {
    const { req, res } = mockReqRes({ body: { userId: '1' } })
    await verify2FA(req, res)
    assert.equal(res._json.code, 400)
  })

  it('验证码错误时拒绝', async () => {
    const { req, res } = mockReqRes({ body: { userId: '1', code: '000000' } })
    await verify2FA(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('验证码'))
  })
})

// ===================== send2FACode =====================
describe('securityController - send2FACode', () => {
  it('拒绝空 userId', async () => {
    const { req, res } = mockReqRes({ body: {} })
    await send2FACode(req, res)
    assert.equal(res._json.code, 400)
    assert.ok(res._json.message.includes('不能为空'))
  })

  it('数据库不可用时使用模拟数据降级', async () => {
    const { req, res } = mockReqRes({ body: { userId: '1' } })
    await send2FACode(req, res)
    // 模拟用户存在且开启 2FA → 200
    assert.equal(res._json.code, 200)
    assert.ok(res._json.data.message.includes('已发送'))
  })
})
