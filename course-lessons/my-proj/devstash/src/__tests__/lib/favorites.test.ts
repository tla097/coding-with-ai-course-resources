import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findMany: vi.fn(),
    },
    collection: {
      findMany: vi.fn(),
    },
  },
}))

import { getFavoriteItems, getFavoriteCollections } from '@/lib/db/favorites'

const mockFavoriteItem = {
  id: 'item-1',
  title: 'useDebounce Hook',
  description: 'Custom React hook',
  isFavorite: true,
  isPinned: false,
  createdAt: new Date('2026-06-08'),
  updatedAt: new Date('2026-06-08'),
  contentType: 'TEXT',
  url: null,
  itemType: { id: 'type-1', name: 'snippet', icon: 'Code', color: '#3b82f6' },
  tags: [{ id: 'tag-1', name: 'react' }],
}

describe('getFavoriteItems', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns favorited items for the user', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.findMany).mockResolvedValue([mockFavoriteItem] as never)

    const result = await getFavoriteItems('user-1')
    expect(result).toEqual([mockFavoriteItem])
  })

  it('returns empty array when user has no favorites', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.findMany).mockResolvedValue([])

    const result = await getFavoriteItems('user-1')
    expect(result).toEqual([])
  })

  it('scopes query to userId and isFavorite: true', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.findMany).mockResolvedValue([])

    await getFavoriteItems('user-abc')

    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isFavorite: true, userId: 'user-abc' },
      }),
    )
  })

  it('orders by updatedAt descending', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.findMany).mockResolvedValue([])

    await getFavoriteItems('user-1')

    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { updatedAt: 'desc' },
      }),
    )
  })
})

describe('getFavoriteCollections', () => {
  beforeEach(() => vi.clearAllMocks())

  const mockCollectionRow = {
    id: 'col-1',
    name: 'React Patterns',
    description: 'Reusable React patterns',
    updatedAt: new Date('2026-06-08'),
    _count: { items: 5 },
  }

  it('returns mapped favorite collections for the user', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findMany).mockResolvedValue([mockCollectionRow] as never)

    const result = await getFavoriteCollections('user-1')
    expect(result).toEqual([
      {
        id: 'col-1',
        name: 'React Patterns',
        description: 'Reusable React patterns',
        updatedAt: mockCollectionRow.updatedAt,
        itemCount: 5,
      },
    ])
  })

  it('maps _count.items to itemCount', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      { ...mockCollectionRow, _count: { items: 12 } },
    ] as never)

    const result = await getFavoriteCollections('user-1')
    expect(result[0].itemCount).toBe(12)
  })

  it('returns empty array when user has no favorite collections', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findMany).mockResolvedValue([])

    const result = await getFavoriteCollections('user-1')
    expect(result).toEqual([])
  })

  it('scopes query to userId and isFavorite: true', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findMany).mockResolvedValue([])

    await getFavoriteCollections('user-xyz')

    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isFavorite: true, userId: 'user-xyz' },
      }),
    )
  })

  it('orders by updatedAt descending', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findMany).mockResolvedValue([])

    await getFavoriteCollections('user-1')

    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { updatedAt: 'desc' },
      }),
    )
  })

  it('handles collection with zero items', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      { ...mockCollectionRow, _count: { items: 0 } },
    ] as never)

    const result = await getFavoriteCollections('user-1')
    expect(result[0].itemCount).toBe(0)
  })
})
