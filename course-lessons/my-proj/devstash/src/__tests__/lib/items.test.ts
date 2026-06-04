import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { createItem, getItemById, deleteItem } from '@/lib/db/items'

const mockItem = {
  id: 'item-1',
  title: 'useAuth Hook',
  description: 'Custom auth hook',
  language: 'typescript',
  contentType: 'TEXT',
  content: 'export function useAuth() {}',
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  isFavorite: false,
  isPinned: false,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  itemType: { id: 'type-1', name: 'snippet', icon: 'Code', color: '#3b82f6' },
  tags: [{ id: 'tag-1', name: 'react' }],
  collections: [],
}

const createData = {
  title: 'New Snippet',
  description: 'desc',
  content: 'const x = 1',
  url: null,
  language: 'typescript',
  tags: ['react'],
  itemTypeId: 'type-1',
  contentType: 'TEXT' as const,
}

const mockCreatedItem = {
  id: 'item-new',
  title: 'New Snippet',
  description: 'desc',
  language: 'typescript',
  contentType: 'TEXT',
  content: 'const x = 1',
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  isFavorite: false,
  isPinned: false,
  createdAt: new Date('2026-06-04'),
  updatedAt: new Date('2026-06-04'),
  itemType: { id: 'type-1', name: 'snippet', icon: 'Code', color: '#3b82f6' },
  tags: [{ id: 'tag-1', name: 'react' }],
  collections: [],
}

describe('createItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the created item', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.create).mockResolvedValue(mockCreatedItem as never)

    const result = await createItem('user-1', createData)
    expect(result).toEqual(mockCreatedItem)
  })

  it('passes userId and itemTypeId to prisma', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.create).mockResolvedValue(mockCreatedItem as never)

    await createItem('user-1', createData)

    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          itemTypeId: 'type-1',
        }),
      }),
    )
  })

  it('passes contentType TEXT for non-link items', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.create).mockResolvedValue(mockCreatedItem as never)

    await createItem('user-1', { ...createData, contentType: 'TEXT' })

    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contentType: 'TEXT' }),
      }),
    )
  })

  it('passes contentType URL for link items', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.create).mockResolvedValue({ ...mockCreatedItem, contentType: 'URL' } as never)

    await createItem('user-1', { ...createData, url: 'https://example.com', contentType: 'URL' })

    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contentType: 'URL', url: 'https://example.com' }),
      }),
    )
  })

  it('uses connectOrCreate for tags', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.create).mockResolvedValue(mockCreatedItem as never)

    await createItem('user-1', { ...createData, tags: ['react', 'hooks'] })

    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tags: {
            connectOrCreate: [
              { where: { name: 'react' }, create: { name: 'react' } },
              { where: { name: 'hooks' }, create: { name: 'hooks' } },
            ],
          },
        }),
      }),
    )
  })
})

describe('deleteItem', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns false when item does not exist or belongs to another user', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null)

    const result = await deleteItem('item-1', 'user-1')
    expect(result).toBe(false)
    expect(prisma.item.delete).not.toHaveBeenCalled()
  })

  it('deletes the item and returns true when found for the correct user', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.findFirst).mockResolvedValue({ id: 'item-1' } as never)
    vi.mocked(prisma.item.delete).mockResolvedValue({} as never)

    const result = await deleteItem('item-1', 'user-1')
    expect(result).toBe(true)
    expect(prisma.item.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } })
  })

  it('scopes ownership check to both id and userId', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null)

    await deleteItem('item-abc', 'user-xyz')

    expect(prisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'item-abc', userId: 'user-xyz' } })
    )
  })
})

describe('getItemById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when item is not found', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null)

    const result = await getItemById('item-1', 'user-1')
    expect(result).toBeNull()
  })

  it('scopes query to both id and userId to prevent cross-user access', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null)

    await getItemById('item-abc', 'user-xyz')

    expect(prisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-abc', userId: 'user-xyz' },
      })
    )
  })

  it('returns the item when found for the correct user', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.item.findFirst).mockResolvedValue(mockItem as never)

    const result = await getItemById('item-1', 'user-1')
    expect(result).toEqual(mockItem)
  })
})
