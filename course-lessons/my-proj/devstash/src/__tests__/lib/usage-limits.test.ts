import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkItemLimit, checkCollectionLimit } from '@/lib/usage-limits'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: { count: vi.fn() },
    collection: { count: vi.fn() },
  },
}))

vi.mock('@/lib/constants', () => ({
  FREE_TIER_ITEM_LIMIT: 50,
  FREE_TIER_COLLECTION_LIMIT: 3,
}))

import { prisma } from '@/lib/prisma'

describe('checkItemLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows Pro users without querying DB', async () => {
    const result = await checkItemLimit('user_1', true)
    expect(result.allowed).toBe(true)
    expect(prisma.item.count).not.toHaveBeenCalled()
  })

  it('allows free users below the limit', async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(49)
    const result = await checkItemLimit('user_1', false)
    expect(result.allowed).toBe(true)
  })

  it('blocks free users at the limit', async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(50)
    const result = await checkItemLimit('user_1', false)
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.limitReached).toBe('items')
      expect(result.error).toMatch(/50 items/)
    }
  })

  it('blocks free users above the limit', async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(75)
    const result = await checkItemLimit('user_1', false)
    expect(result.allowed).toBe(false)
  })
})

describe('checkCollectionLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows Pro users without querying DB', async () => {
    const result = await checkCollectionLimit('user_1', true)
    expect(result.allowed).toBe(true)
    expect(prisma.collection.count).not.toHaveBeenCalled()
  })

  it('allows free users below the limit', async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(2)
    const result = await checkCollectionLimit('user_1', false)
    expect(result.allowed).toBe(true)
  })

  it('blocks free users at the limit', async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(3)
    const result = await checkCollectionLimit('user_1', false)
    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.limitReached).toBe('collections')
      expect(result.error).toMatch(/3 collections/)
    }
  })

  it('blocks free users above the limit', async () => {
    vi.mocked(prisma.collection.count).mockResolvedValue(5)
    const result = await checkCollectionLimit('user_1', false)
    expect(result.allowed).toBe(false)
  })
})
