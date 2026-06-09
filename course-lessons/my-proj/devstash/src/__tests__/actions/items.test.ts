import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db/items', () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  toggleItemFavorite: vi.fn(),
  toggleItemPin: vi.fn(),
}))
vi.mock('@/lib/usage-limits', () => ({
  checkItemLimit: vi.fn().mockResolvedValue({ allowed: true }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn(() => ({
    storage: { from: vi.fn(() => ({ remove: vi.fn().mockResolvedValue({ error: null }) })) },
  })),
  SUPABASE_BUCKET: 'my-files',
}))

import { createItem, updateItem, deleteItem, toggleItemFavorite, toggleItemPin } from '@/actions/items'
import { auth } from '@/auth'
import {
  createItem as dbCreateItem,
  updateItem as dbUpdateItem,
  deleteItem as dbDeleteItem,
  toggleItemFavorite as dbToggleItemFavorite,
  toggleItemPin as dbToggleItemPin,
} from '@/lib/db/items'
import { createSupabaseServer } from '@/lib/supabase/server'

const mockAuth = vi.mocked(auth)
const mockDbCreate = vi.mocked(dbCreateItem)
const mockDbUpdate = vi.mocked(dbUpdateItem)
const mockSupabaseServer = vi.mocked(createSupabaseServer)
const mockDbDelete = vi.mocked(dbDeleteItem)
const mockDbToggleFavorite = vi.mocked(dbToggleItemFavorite)
const mockDbTogglePin = vi.mocked(dbToggleItemPin)

const mockSession = { user: { id: 'user-1', isPro: false } }

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

const validCreateInput = {
  title: 'My Snippet',
  description: 'A useful snippet',
  content: 'const x = 1',
  url: null,
  language: 'typescript',
  tags: ['react'],
  itemTypeId: 'type-snippet',
  itemTypeName: 'snippet' as const,
}

const mockCreatedItem = {
  id: 'item-new',
  title: 'My Snippet',
  description: 'A useful snippet',
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
  itemType: { id: 'type-snippet', name: 'snippet', icon: 'Code', color: '#3b82f6' },
  tags: [{ id: 'tag-1', name: 'react' }],
  collections: [],
}

describe('createItem server action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns not authenticated when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await createItem(validCreateInput)
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockDbCreate).not.toHaveBeenCalled()
  })

  it('returns not authenticated when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)
    const result = await createItem(validCreateInput)
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
  })

  it('returns validation error when title is empty', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await createItem({ ...validCreateInput, title: '' })
    expect(result.success).toBe(false)
    if (!result.success && typeof result.error !== 'string') {
      expect(result.error.title).toBeDefined()
    }
    expect(mockDbCreate).not.toHaveBeenCalled()
  })

  it('returns validation error when link type has no URL', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await createItem({
      ...validCreateInput,
      url: null,
      itemTypeName: 'link',
    })
    expect(result.success).toBe(false)
    if (!result.success && typeof result.error !== 'string') {
      expect(result.error.url).toBeDefined()
    }
  })

  it('returns validation error for invalid URL', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await createItem({
      ...validCreateInput,
      url: 'not-a-url',
      itemTypeName: 'link',
    })
    expect(result.success).toBe(false)
  })

  it('returns success with created item on valid input', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue(mockCreatedItem)
    const result = await createItem(validCreateInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('My Snippet')
      expect(result.data.contentType).toBe('TEXT')
    }
  })

  it('sets contentType TEXT for non-link types', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue(mockCreatedItem)
    await createItem(validCreateInput)
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ contentType: 'TEXT' }),
    )
  })

  it('sets contentType URL for link type', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue({ ...mockCreatedItem, contentType: 'URL', url: 'https://example.com' })
    await createItem({
      ...validCreateInput,
      url: 'https://example.com',
      itemTypeName: 'link',
    })
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ contentType: 'URL' }),
    )
  })

  it('passes userId from session to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue(mockCreatedItem)
    await createItem(validCreateInput)
    expect(mockDbCreate).toHaveBeenCalledWith('user-1', expect.any(Object))
  })

  it('passes itemTypeId to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue(mockCreatedItem)
    await createItem(validCreateInput)
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ itemTypeId: 'type-snippet' }),
    )
  })

  it('returns error when db throws', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockRejectedValue(new Error('DB error'))
    const result = await createItem(validCreateInput)
    expect(result).toEqual({ success: false, error: 'Failed to create item.' })
  })

  it('trims whitespace from title', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue(mockCreatedItem)
    await createItem({ ...validCreateInput, title: '  My Snippet  ' })
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ title: 'My Snippet' }),
    )
  })

  it('accepts valid URL for link type', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue({ ...mockCreatedItem, contentType: 'URL', url: 'https://example.com' })
    const result = await createItem({
      ...validCreateInput,
      url: 'https://example.com',
      itemTypeName: 'link',
    })
    expect(result.success).toBe(true)
  })

  it('passes collectionIds to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue(mockCreatedItem)
    await createItem({ ...validCreateInput, collectionIds: ['col-1'] })
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ collectionIds: ['col-1'] }),
    )
  })

  it('defaults collectionIds to empty array when not provided', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue(mockCreatedItem)
    await createItem(validCreateInput)
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ collectionIds: [] }),
    )
  })

  it('sets contentType FILE for file type', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue({ ...mockCreatedItem, contentType: 'FILE' })
    await createItem({
      ...validCreateInput,
      itemTypeName: 'file',
      fileUrl: 'user-1/123-test.pdf',
      fileName: 'test.pdf',
      fileSize: 1024,
    })
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ contentType: 'FILE' }),
    )
  })

  it('sets contentType FILE for image type', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue({ ...mockCreatedItem, contentType: 'FILE' })
    await createItem({
      ...validCreateInput,
      itemTypeName: 'image',
      fileUrl: 'user-1/123-test.png',
      fileName: 'test.png',
      fileSize: 2048,
    })
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ contentType: 'FILE' }),
    )
  })

  it('returns validation error when file type has no fileUrl', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await createItem({
      ...validCreateInput,
      itemTypeName: 'file',
      fileUrl: null,
    })
    expect(result.success).toBe(false)
    if (!result.success && typeof result.error !== 'string') {
      expect(result.error.fileUrl).toBeDefined()
    }
    expect(mockDbCreate).not.toHaveBeenCalled()
  })

  it('passes fileUrl, fileName, fileSize to db for file type', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue({ ...mockCreatedItem, contentType: 'FILE' })
    await createItem({
      ...validCreateInput,
      itemTypeName: 'file',
      fileUrl: 'user-1/123-test.pdf',
      fileName: 'test.pdf',
      fileSize: 1024,
    })
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        fileUrl: 'user-1/123-test.pdf',
        fileName: 'test.pdf',
        fileSize: 1024,
      }),
    )
  })
})

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

  it('returns item not found when db returns null (ownership mismatch)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDbDelete.mockResolvedValue(null)
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: false, error: 'Item not found.' })
  })

  it('returns success when item is deleted', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDbDelete.mockResolvedValue({ fileUrl: null })
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: true })
  })

  it('passes correct itemId and userId to db', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDbDelete.mockResolvedValue({ fileUrl: null })
    await deleteItem('item-abc')
    expect(mockDbDelete).toHaveBeenCalledWith('item-abc', 'user-1')
  })

  it('returns error when db throws', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDbDelete.mockRejectedValue(new Error('DB error'))
    const result = await deleteItem('item-1')
    expect(result).toEqual({ success: false, error: 'Failed to delete item.' })
  })

  it('calls supabase storage remove when deleted item has a fileUrl', async () => {
    const mockRemove = vi.fn().mockResolvedValue({ error: null })
    mockSupabaseServer.mockReturnValueOnce({
      storage: { from: vi.fn(() => ({ remove: mockRemove })) },
    } as never)
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDbDelete.mockResolvedValue({ fileUrl: 'user-1/123-file.pdf' })
    await deleteItem('item-1')
    expect(mockRemove).toHaveBeenCalledWith(['user-1/123-file.pdf'])
  })

  it('does not call supabase when deleted item has no fileUrl', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDbDelete.mockResolvedValue({ fileUrl: null })
    await deleteItem('item-1')
    expect(mockSupabaseServer).not.toHaveBeenCalled()
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

  it('passes collectionIds to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue(mockItemDetail)
    await updateItem('item-1', { ...validInput, collectionIds: ['col-1', 'col-2'] })
    expect(mockDbUpdate).toHaveBeenCalledWith(
      'item-1',
      'user-1',
      expect.objectContaining({ collectionIds: ['col-1', 'col-2'] }),
    )
  })

  it('defaults collectionIds to empty array when not provided', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue(mockItemDetail)
    await updateItem('item-1', validInput)
    expect(mockDbUpdate).toHaveBeenCalledWith(
      'item-1',
      'user-1',
      expect.objectContaining({ collectionIds: [] }),
    )
  })
})

describe('toggleItemFavorite server action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns not authenticated when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await toggleItemFavorite('item-1')
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockDbToggleFavorite).not.toHaveBeenCalled()
  })

  it('returns updated isFavorite true on success', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbToggleFavorite.mockResolvedValue(true)
    const result = await toggleItemFavorite('item-1')
    expect(result).toEqual({ success: true, data: { isFavorite: true } })
  })

  it('returns updated isFavorite false on success', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbToggleFavorite.mockResolvedValue(false)
    const result = await toggleItemFavorite('item-1')
    expect(result).toEqual({ success: true, data: { isFavorite: false } })
  })

  it('returns item not found when db returns null', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbToggleFavorite.mockResolvedValue(null)
    const result = await toggleItemFavorite('item-1')
    expect(result).toEqual({ success: false, error: 'Item not found.' })
  })

  it('passes itemId and userId to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbToggleFavorite.mockResolvedValue(true)
    await toggleItemFavorite('item-1')
    expect(mockDbToggleFavorite).toHaveBeenCalledWith('item-1', 'user-1')
  })

  it('returns error when db throws', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbToggleFavorite.mockRejectedValue(new Error('DB error'))
    const result = await toggleItemFavorite('item-1')
    expect(result).toEqual({ success: false, error: 'Failed to update favorite.' })
  })
})

describe('toggleItemPin server action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns not authenticated when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await toggleItemPin('item-1')
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockDbTogglePin).not.toHaveBeenCalled()
  })

  it('returns updated isPinned true on success', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbTogglePin.mockResolvedValue(true)
    const result = await toggleItemPin('item-1')
    expect(result).toEqual({ success: true, data: { isPinned: true } })
  })

  it('returns updated isPinned false on success', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbTogglePin.mockResolvedValue(false)
    const result = await toggleItemPin('item-1')
    expect(result).toEqual({ success: true, data: { isPinned: false } })
  })

  it('returns item not found when db returns null', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbTogglePin.mockResolvedValue(null)
    const result = await toggleItemPin('item-1')
    expect(result).toEqual({ success: false, error: 'Item not found.' })
  })

  it('passes itemId and userId to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbTogglePin.mockResolvedValue(true)
    await toggleItemPin('item-1')
    expect(mockDbTogglePin).toHaveBeenCalledWith('item-1', 'user-1')
  })

  it('returns error when db throws', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbTogglePin.mockRejectedValue(new Error('DB error'))
    const result = await toggleItemPin('item-1')
    expect(result).toEqual({ success: false, error: 'Failed to update pin.' })
  })
})
