import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db/items', () => ({ updateItem: vi.fn(), deleteItem: vi.fn() }))

import { updateItem, deleteItem } from '@/actions/items'
import { auth } from '@/auth'
import { updateItem as dbUpdateItem, deleteItem as dbDeleteItem } from '@/lib/db/items'

const mockAuth = vi.mocked(auth)
const mockDbUpdate = vi.mocked(dbUpdateItem)
const mockDbDelete = vi.mocked(dbDeleteItem)

const mockSession = { user: { id: 'user-1' } }

const validInput = {
  title: 'Updated Title',
  description: 'A description',
  content: 'Some content',
  url: null,
  language: 'typescript',
  tags: ['react', 'hooks'],
}

const mockItemDetail = {
  id: 'item-1',
  title: 'Updated Title',
  description: 'A description',
  language: 'typescript',
  contentType: 'TEXT',
  content: 'Some content',
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  isFavorite: false,
  isPinned: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-06-04'),
  itemType: { id: 'type-1', name: 'snippet', icon: 'Code', color: '#3b82f6' },
  tags: [{ id: 'tag-1', name: 'react' }, { id: 'tag-2', name: 'hooks' }],
  collections: [],
}

describe('deleteItem server action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns not authenticated when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockDbDelete).not.toHaveBeenCalled()
  })

  it('returns not authenticated when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
  })

  it('returns item not found when db returns false (ownership mismatch)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDbDelete.mockResolvedValue(false)
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: false, error: 'Item not found.' })
  })

  it('returns success when item is deleted', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDbDelete.mockResolvedValue(true)
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: true })
  })

  it('passes correct itemId and userId to db', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDbDelete.mockResolvedValue(true)
    await deleteItem('item-abc')
    expect(mockDbDelete).toHaveBeenCalledWith('item-abc', 'user-1')
  })

  it('returns error when db throws', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDbDelete.mockRejectedValue(new Error('DB error'))
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: false, error: 'Failed to delete item.' })
  })
})

describe('updateItem server action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns not authenticated when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await updateItem('item-1', validInput)
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('returns not authenticated when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)
    const result = await updateItem('item-1', validInput)
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
  })

  it('returns validation error when title is empty', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await updateItem('item-1', { ...validInput, title: '' })
    expect(result.success).toBe(false)
    if (!result.success && typeof result.error !== 'string') {
      expect(result.error.title).toBeDefined()
    }
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('returns validation error when title is only whitespace', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await updateItem('item-1', { ...validInput, title: '   ' })
    expect(result.success).toBe(false)
    if (!result.success && typeof result.error !== 'string') {
      expect(result.error.title).toBeDefined()
    }
  })

  it('returns validation error for invalid URL', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await updateItem('item-1', { ...validInput, url: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success && typeof result.error !== 'string') {
      expect(result.error.url).toBeDefined()
    }
  })

  it('accepts null URL without error', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue(mockItemDetail)
    const result = await updateItem('item-1', { ...validInput, url: null })
    expect(result.success).toBe(true)
  })

  it('returns item not found when db returns null (ownership mismatch)', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue(null)
    const result = await updateItem('item-1', validInput)
    expect(result).toEqual({ success: false, error: 'Item not found.' })
  })

  it('returns success with updated item on valid input', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue(mockItemDetail)
    const result = await updateItem('item-1', validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Updated Title')
      expect(result.data.tags).toHaveLength(2)
    }
  })

  it('returns error when db throws', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockRejectedValue(new Error('DB error'))
    const result = await updateItem('item-1', validInput)
    expect(result).toEqual({ success: false, error: 'Failed to update item.' })
  })

  it('trims whitespace from title before passing to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue(mockItemDetail)
    await updateItem('item-1', { ...validInput, title: '  My Title  ' })
    expect(mockDbUpdate).toHaveBeenCalledWith(
      'item-1',
      'user-1',
      expect.objectContaining({ title: 'My Title' }),
    )
  })

  it('passes correct userId from session to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue(mockItemDetail)
    await updateItem('item-1', validInput)
    expect(mockDbUpdate).toHaveBeenCalledWith('item-1', 'user-1', expect.any(Object))
  })

  it('passes parsed tags array to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue(mockItemDetail)
    await updateItem('item-1', { ...validInput, tags: ['react', 'next'] })
    expect(mockDbUpdate).toHaveBeenCalledWith(
      'item-1',
      'user-1',
      expect.objectContaining({ tags: ['react', 'next'] }),
    )
  })
})
