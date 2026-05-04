import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { success, error } from '../utils/response.js'

describe('response utils', () => {
  it('success returns code 200 with data and message', () => {
    const res = success({ id: 1 })
    assert.equal(res.code, 200)
    assert.equal(res.message, '成功')
    assert.deepEqual(res.data, { id: 1 })
  })

  it('success uses default message', () => {
    const res = success()
    assert.equal(res.message, '成功')
  })

  it('success accepts custom message', () => {
    const res = success(null, '操作完成')
    assert.equal(res.message, '操作完成')
  })

  it('error returns code 500 with message', () => {
    const res = error('出错了')
    assert.equal(res.code, 500)
    assert.equal(res.message, '出错了')
    assert.equal(res.data, null)
  })

  it('error accepts custom code', () => {
    const res = error('未授权', 401)
    assert.equal(res.code, 401)
  })

  it('error uses defaults', () => {
    const res = error()
    assert.equal(res.code, 500)
    assert.equal(res.message, '失败')
  })
})
