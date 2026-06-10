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

import { getSearchData } from '@/lib/db/search'
import { prisma } from '@/lib/prisma'

const mockPrismaItem = vi.mocked(prisma.item.findMany)
const mockPrismaCollection = vi.mocked(prisma.collection.findMany)

const snippet = {
  id: 'item-1',
  title: 'useAuth Hook',
  content: 'export function useAuth() { return useContext(AuthContext) }',
  url: null,
  itemType: { name: 'snippet', icon: 'Code', color: '#3b82f6' },
}

const link = {
  id: 'item-2',
  title: 'React Docs',
  content: null,
  url: 'https://react.dev',
  itemType: { name: 'link', icon: 'Link', color: '#10b981' },
}

const collection = {
  id: 'col-1',
  name: 'React Patterns',
  _count: { items: 5 },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSearchData', () => {
  it('returns items and collections for a user', async () => {
    mockPrismaItem.mockResolvedValue([snippet] as never)
    mockPrismaCollection.mockResolvedValue([collection] as never)

    const result = await getSearchData('user-1')

    expect(result.items).toHaveLength(1)
    expect(result.collections).toHaveLength(1)
  })

  it('maps item fields correctly', async () => {
    mockPrismaItem.mockResolvedValue([snippet] as never)
    mockPrismaCollection.mockResolvedValue([] as never)

    const result = await getSearchData('user-1')
    const item = result.items[0]

    expect(item.id).toBe('item-1')
    expect(item.title).toBe('useAuth Hook')
    expect(item.itemType).toEqual({ name: 'snippet', icon: 'Code', color: '#3b82f6' })
  })

  it('returns null contentPreview for text items without a url', async () => {
    mockPrismaItem.mockResolvedValue([snippet] as never)
    mockPrismaCollection.mockResolvedValue([] as never)

    const result = await getSearchData('user-1')

    expect(result.items[0].contentPreview).toBeNull()
  })

  it('limits item results to 500 to avoid loading large text fields', async () => {
    mockPrismaItem.mockResolvedValue([] as never)
    mockPrismaCollection.mockResolvedValue([] as never)

    await getSearchData('user-1')

    expect(mockPrismaItem).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 }),
    )
  })

  it('falls back to url as contentPreview when content is null', async () => {
    mockPrismaItem.mockResolvedValue([link] as never)
    mockPrismaCollection.mockResolvedValue([] as never)

    const result = await getSearchData('user-1')

    expect(result.items[0].contentPreview).toBe('https://react.dev')
  })

  it('sets contentPreview to null when both content and url are null', async () => {
    const itemNoContent = { ...snippet, content: null, url: null }
    mockPrismaItem.mockResolvedValue([itemNoContent] as never)
    mockPrismaCollection.mockResolvedValue([] as never)

    const result = await getSearchData('user-1')

    expect(result.items[0].contentPreview).toBeNull()
  })

  it('maps collection fields correctly', async () => {
    mockPrismaItem.mockResolvedValue([] as never)
    mockPrismaCollection.mockResolvedValue([collection] as never)

    const result = await getSearchData('user-1')
    const col = result.collections[0]

    expect(col.id).toBe('col-1')
    expect(col.name).toBe('React Patterns')
    expect(col.itemCount).toBe(5)
  })

  it('maps itemCount from _count.items', async () => {
    const emptyCollection = { id: 'col-2', name: 'Empty', _count: { items: 0 } }
    mockPrismaItem.mockResolvedValue([] as never)
    mockPrismaCollection.mockResolvedValue([emptyCollection] as never)

    const result = await getSearchData('user-1')

    expect(result.collections[0].itemCount).toBe(0)
  })

  it('returns empty arrays when user has no data', async () => {
    mockPrismaItem.mockResolvedValue([] as never)
    mockPrismaCollection.mockResolvedValue([] as never)

    const result = await getSearchData('user-1')

    expect(result.items).toEqual([])
    expect(result.collections).toEqual([])
  })

  it('queries only the given userId', async () => {
    mockPrismaItem.mockResolvedValue([] as never)
    mockPrismaCollection.mockResolvedValue([] as never)

    await getSearchData('user-42')

    expect(mockPrismaItem).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-42' } }),
    )
    expect(mockPrismaCollection).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-42' } }),
    )
  })
})
