import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { USER_LEVEL, USER_LEVEL_TEXT } from '../constants/userLevel.js'

describe('USER_LEVEL constants', () => {
  it('has 4 levels', () => {
    assert.equal(USER_LEVEL.BEGINNER, 1)
    assert.equal(USER_LEVEL.INTERMEDIATE, 2)
    assert.equal(USER_LEVEL.ADVANCED, 3)
    assert.equal(USER_LEVEL.ADMIN, 4)
  })

  it('every level has a text label', () => {
    assert.equal(USER_LEVEL_TEXT[1], '入门级')
    assert.equal(USER_LEVEL_TEXT[4], '管理员级')
  })
})
