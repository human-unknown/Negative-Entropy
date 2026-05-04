import { describe, it, expect } from 'vitest'
import { formatDate, debounce } from '../utils/helpers.js'

describe('formatDate', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('formats a valid date string', () => {
    const result = formatDate('2026-05-03T12:00:00')
    expect(result).toContain('2026')
    expect(result).toContain('5')
  })

  it('formats a Date object', () => {
    const result = formatDate(new Date('2026-01-15T08:30:00'))
    expect(result).toContain('2026')
  })
})

describe('debounce', () => {
  it('only calls the function once after the delay', async () => {
    let count = 0
    const fn = debounce(() => { count++ }, 100)

    fn()
    fn()
    fn()

    await new Promise(r => setTimeout(r, 200))
    expect(count).toBe(1)
  })

  it('uses default delay of 300ms', async () => {
    let count = 0
    const fn = debounce(() => { count++ })

    fn()
    await new Promise(r => setTimeout(r, 400))
    expect(count).toBe(1)
  })
})
