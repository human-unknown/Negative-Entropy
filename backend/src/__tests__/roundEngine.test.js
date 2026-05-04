import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { advanceRound } from '../utils/roundEngine.js'

/**
 * Create a mock MySQL connection whose query() returns results sequentially.
 * Each call advances through `results` in order.
 *
 * @param {Array} results - Array of [rows, fields] pairs returned by query()
 * @returns {{ query: Function }}
 */
function mockConnection(...results) {
  let callIndex = 0
  return {
    query: mock.fn((sql, params) => {
      if (callIndex >= results.length) {
        return Promise.resolve([[], {}])
      }
      return Promise.resolve(results[callIndex++])
    })
  }
}

describe('roundEngine - advanceRound', () => {

  it('throws when debate topic is not found', async () => {
    const conn = mockConnection(
      [[], {}]        // SELECT ... FROM debate_topic WHERE id = ? FOR UPDATE → empty
    )

    await assert.rejects(
      () => advanceRound(conn, 999),
      (err) => {
        assert.match(err.message, /辩论话题不存在/)
        return true
      }
    )
  })

  it('throws when topic has no template_id', async () => {
    const conn = mockConnection(
      [[{ id: 1, template_id: null, current_round: 1 }], {}]   // topic row
    )

    await assert.rejects(
      () => advanceRound(conn, 1),
      (err) => {
        assert.match(err.message, /非模板辩论不支持轮次推进/)
        return true
      }
    )
  })

  it('throws when template config is not found', async () => {
    const conn = mockConnection(
      [[{ id: 1, template_id: 5, current_round: 1 }], {}],  // topic row
      [[], {}]                                                 // template not found
    )

    await assert.rejects(
      () => advanceRound(conn, 1),
      (err) => {
        assert.match(err.message, /辩论模板不存在/)
        return true
      }
    )
  })
})
