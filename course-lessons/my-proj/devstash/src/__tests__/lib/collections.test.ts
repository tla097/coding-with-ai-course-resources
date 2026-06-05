import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import {
  getAllCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
  getCollectionCount,
} from '@/lib/db/collections'

const snippetType = { id: 'type-snippet', name: 'snippet', icon: 'Code', color: '#3b82f6' }
const promptType = { id: 'type-prompt', name: 'prompt', icon: 'Sparkles', color: '#8b5cf6' }

function makeCollection(overrides: object = {}) {
  return {
    id: 'col-1',
    name: 'React Patterns',
    description: 'Useful React patterns',
    isFavorite: false,
    createdAt: new Date('2026-06-01'),
    items: [],
    ...overrides,
  }
}

function makeCollectionItem(type = snippetType) {
  return { item: { itemType: type } }
}

describe('getCollectionById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when collection is not found', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null)

    const result = await getCollectionById('col-1', 'user-1')
    expect(result).toBeNull()
  })

  it('scopes query to both id and userId to prevent cross-user access', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(null)

    await getCollectionById('col-abc', 'user-xyz')

    expect(prisma.collection.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'col-abc', userId: 'user-xyz' } }),
    )
  })

  it('returns collection with itemCount 0 and null dominantType when empty', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(makeCollection() as never)

    const result = await getCollectionById('col-1', 'user-1')
    expect(result).not.toBeNull()
    expect(result!.itemCount).toBe(0)
    expect(result!.dominantType).toBeNull()
    expect(result!.types).toEqual([])
  })

  it('returns correct itemCount and dominantType for a collection with items', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(
      makeCollection({
        items: [makeCollectionItem(snippetType), makeCollectionItem(snippetType), makeCollectionItem(promptType)],
      }) as never,
    )

    const result = await getCollectionById('col-1', 'user-1')
    expect(result!.itemCount).toBe(3)
    expect(result!.dominantType).toEqual({ icon: snippetType.icon, color: snippetType.color })
  })

  it('returns all unique types present in the collection', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(
      makeCollection({
        items: [makeCollectionItem(snippetType), makeCollectionItem(promptType)],
      }) as never,
    )

    const result = await getCollectionById('col-1', 'user-1')
    expect(result!.types).toHaveLength(2)
    const typeIds = result!.types.map(t => t.id)
    expect(typeIds).toContain(snippetType.id)
    expect(typeIds).toContain(promptType.id)
  })

  it('maps collection fields correctly', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findFirst).mockResolvedValue(makeCollection() as never)

    const result = await getCollectionById('col-1', 'user-1')
    expect(result).toMatchObject({
      id: 'col-1',
      name: 'React Patterns',
      description: 'Useful React patterns',
      isFavorite: false,
    })
  })
})

describe('getAllCollections', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns an empty array when user has no collections', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findMany).mockResolvedValue([])

    const result = await getAllCollections('user-1')
    expect(result).toEqual([])
  })

  it('scopes query to userId', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findMany).mockResolvedValue([])

    await getAllCollections('user-abc')

    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-abc' } }),
    )
  })

  it('returns mapped stats for all collections', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      makeCollection({ id: 'col-1', name: 'A', items: [makeCollectionItem(snippetType)] }),
      makeCollection({ id: 'col-2', name: 'B', items: [] }),
    ] as never)

    const result = await getAllCollections('user-1')
    expect(result).toHaveLength(2)
    expect(result[0].itemCount).toBe(1)
    expect(result[1].itemCount).toBe(0)
  })
})

describe('updateCollection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls prisma.collection.update with id, userId, and data', async () => {
    const { prisma } = await import('@/lib/prisma')
    const updated = { ...makeCollection(), name: 'Updated', description: 'New desc' }
    vi.mocked(prisma.collection.update).mockResolvedValue(updated as never)

    await updateCollection('col-1', 'user-1', { name: 'Updated', description: 'New desc' })

    expect(prisma.collection.update).toHaveBeenCalledWith({
      where: { id: 'col-1', userId: 'user-1' },
      data: { name: 'Updated', description: 'New desc' },
    })
  })

  it('stores null when description is null', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.update).mockResolvedValue(makeCollection() as never)

    await updateCollection('col-1', 'user-1', { name: 'Updated', description: null })

    expect(prisma.collection.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ description: null }) }),
    )
  })

  it('returns the updated collection record', async () => {
    const { prisma } = await import('@/lib/prisma')
    const updated = { ...makeCollection(), name: 'Updated' }
    vi.mocked(prisma.collection.update).mockResolvedValue(updated as never)

    const result = await updateCollection('col-1', 'user-1', { name: 'Updated' })
    expect(result.name).toBe('Updated')
  })
})

describe('deleteCollection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls prisma.collection.delete with id and userId', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.delete).mockResolvedValue(makeCollection() as never)

    await deleteCollection('col-1', 'user-1')

    expect(prisma.collection.delete).toHaveBeenCalledWith({
      where: { id: 'col-1', userId: 'user-1' },
    })
  })

  it('scopes delete to userId to prevent cross-user deletion', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.delete).mockResolvedValue(makeCollection() as never)

    await deleteCollection('col-xyz', 'user-abc')

    expect(prisma.collection.delete).toHaveBeenCalledWith({
      where: { id: 'col-xyz', userId: 'user-abc' },
    })
  })
})

describe('getCollectionCount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the total collection count for the user', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.count).mockResolvedValue(7)

    const result = await getCollectionCount('user-1')
    expect(result).toBe(7)
  })

  it('scopes count to userId', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.collection.count).mockResolvedValue(0)

    await getCollectionCount('user-abc')

    expect(prisma.collection.count).toHaveBeenCalledWith({ where: { userId: 'user-abc' } })
  })
})
