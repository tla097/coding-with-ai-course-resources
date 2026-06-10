import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    itemType: { findMany: vi.fn() },
    collection: { findMany: vi.fn() },
    itemCollection: { findMany: vi.fn() },
  },
}))

import { getSidebarData } from '@/lib/db/sidebar'
import { prisma } from '@/lib/prisma'

const mockItemTypes = vi.mocked(prisma.itemType.findMany)
const mockCollections = vi.mocked(prisma.collection.findMany)
const mockItemCollections = vi.mocked(prisma.itemCollection.findMany)

const snippetType = { id: 'it-1', name: 'snippet', icon: 'Code', color: '#3b82f6' }
const promptType = { id: 'it-2', name: 'prompt', icon: 'Sparkles', color: '#8b5cf6' }

const baseItemType = { ...snippetType, isSystem: true, _count: { items: 3 } }

function makeCollection(id: string, isFavorite = false) {
  return { id, name: `Collection ${id}`, isFavorite }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCollections.mockResolvedValue([])
  mockItemCollections.mockResolvedValue([])
  mockItemTypes.mockResolvedValue([baseItemType] as never)
})

describe('getSidebarData', () => {
  it('returns item types with counts from _count', async () => {
    mockItemTypes.mockResolvedValue([
      { ...snippetType, isSystem: true, _count: { items: 5 } },
      { ...promptType, isSystem: true, _count: { items: 2 } },
    ] as never)

    const result = await getSidebarData('user-1')

    expect(result.itemTypes).toHaveLength(2)
    expect(result.itemTypes[0].count).toBe(5)
    expect(result.itemTypes[1].count).toBe(2)
  })

  it('separates favorite collections from recent collections', async () => {
    mockCollections
      .mockResolvedValueOnce([
        makeCollection('col-1', true),
        makeCollection('col-2', false),
        makeCollection('col-3', false),
      ] as never)
      .mockResolvedValueOnce([])

    const result = await getSidebarData('user-1')

    expect(result.favoriteCollections).toHaveLength(1)
    expect(result.favoriteCollections[0].id).toBe('col-1')
    expect(result.recentCollections).toHaveLength(2)
  })

  it('returns null dominantColor for collections with no items', async () => {
    mockCollections
      .mockResolvedValueOnce([makeCollection('col-1')] as never)
      .mockResolvedValueOnce([])

    const result = await getSidebarData('user-1')

    expect(result.recentCollections[0].dominantColor).toBeNull()
  })

  it('computes dominant color as the most frequent item type color', async () => {
    mockCollections
      .mockResolvedValueOnce([makeCollection('col-1')] as never)
      .mockResolvedValueOnce([])
    mockItemCollections.mockResolvedValue([
      { collectionId: 'col-1', item: { itemType: { color: '#3b82f6' } } },
      { collectionId: 'col-1', item: { itemType: { color: '#3b82f6' } } },
      { collectionId: 'col-1', item: { itemType: { color: '#8b5cf6' } } },
    ] as never)

    const result = await getSidebarData('user-1')

    expect(result.recentCollections[0].dominantColor).toBe('#3b82f6')
  })

  it('computes dominant color independently per collection', async () => {
    mockCollections
      .mockResolvedValueOnce([makeCollection('col-1'), makeCollection('col-2')] as never)
      .mockResolvedValueOnce([])
    mockItemCollections.mockResolvedValue([
      { collectionId: 'col-1', item: { itemType: { color: '#3b82f6' } } },
      { collectionId: 'col-2', item: { itemType: { color: '#8b5cf6' } } },
      { collectionId: 'col-2', item: { itemType: { color: '#8b5cf6' } } },
    ] as never)

    const result = await getSidebarData('user-1')
    const col1 = result.recentCollections.find(c => c.id === 'col-1')
    const col2 = result.recentCollections.find(c => c.id === 'col-2')

    expect(col1?.dominantColor).toBe('#3b82f6')
    expect(col2?.dominantColor).toBe('#8b5cf6')
  })

  it('skips the itemCollection query when there are no recent collections', async () => {
    mockCollections.mockResolvedValue([])

    await getSidebarData('user-1')

    expect(mockItemCollections).not.toHaveBeenCalled()
  })

  it('returns allCollections from the second collection query', async () => {
    mockCollections
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'col-a', name: 'Alpha' },
        { id: 'col-b', name: 'Beta' },
      ] as never)

    const result = await getSidebarData('user-1')

    expect(result.allCollections).toHaveLength(2)
    expect(result.allCollections[0].name).toBe('Alpha')
  })
})
