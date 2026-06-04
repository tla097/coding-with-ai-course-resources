import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { getItemById, deleteItem } from '@/lib/db/items'

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
