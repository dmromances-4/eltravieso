import { describe, expect, it } from 'vitest'
import { isPremiumContentLocked } from '@/lib/blog/premium'

describe('blog premium gating', () => {
  it('locks premium content for non-VIP users', () => {
    expect(isPremiumContentLocked(true, false)).toBe(true)
  })

  it('unlocks premium content for VIP users', () => {
    expect(isPremiumContentLocked(true, true)).toBe(false)
  })

  it('never locks non-premium content', () => {
    expect(isPremiumContentLocked(false, false)).toBe(false)
    expect(isPremiumContentLocked(false, true)).toBe(false)
  })
})
