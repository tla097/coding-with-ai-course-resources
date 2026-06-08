import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db/collections', () => ({
  createCollection: vi.fn(),
  getRecentCollections: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  toggleCollectionFavorite: vi.fn(),
}))
vi.mock('@/lib/usage-limits', () => ({
  checkCollectionLimit: vi.fn().mockResolvedValue({ allowed: true }),
}))

import { createCollection, updateCollection, deleteCollection, toggleCollectionFavorite } from '@/actions/collections'
import { auth } from '@/auth'
import {
  createCollection as dbCreateCollection,
  updateCollection as dbUpdateCollection,
  deleteCollection as dbDeleteCollection,
  toggleCollectionFavorite as dbToggleCollectionFavorite,
} from '@/lib/db/collections'

const mockAuth = vi.mocked(auth)
const mockDbCreate = vi.mocked(dbCreateCollection)
const mockDbUpdate = vi.mocked(dbUpdateCollection)
const mockDbDelete = vi.mocked(dbDeleteCollection)
const mockDbToggleFavorite = vi.mocked(dbToggleCollectionFavorite)

const mockSession = { user: { id: 'user-1', isPro: false } }

const mockCreatedCollection = {
  id: 'col-new',
  name: 'My Collection',
  description: null,
  isFavorite: false,
  defaultTypeId: null,
  createdAt: new Date('2026-06-05'),
  updatedAt: new Date('2026-06-05'),
  userId: 'user-1',
}

describe('createCollection server action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns not authenticated when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await createCollection({ name: 'My Collection' })
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockDbCreate).not.toHaveBeenCalled()
  })

  it('returns not authenticated when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)
    const result = await createCollection({ name: 'My Collection' })
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockDbCreate).not.toHaveBeenCalled()
  })

  it('returns validation error when name is empty', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await createCollection({ name: '' })
    expect(result.success).toBe(false)
    if (!result.success && typeof result.error !== 'string') {
      expect(result.error.name).toBeDefined()
    }
    expect(mockDbCreate).not.toHaveBeenCalled()
  })

  it('returns validation error when name is only whitespace', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await createCollection({ name: '   ' })
    expect(result.success).toBe(false)
    if (!result.success && typeof result.error !== 'string') {
      expect(result.error.name).toBeDefined()
    }
    expect(mockDbCreate).not.toHaveBeenCalled()
  })

  it('returns success with created collection on valid input', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue(mockCreatedCollection)
    const result = await createCollection({ name: 'My Collection' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('My Collection')
    }
  })

  it('passes userId from session to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue(mockCreatedCollection)
    await createCollection({ name: 'My Collection' })
    expect(mockDbCreate).toHaveBeenCalledWith('user-1', expect.any(Object))
  })

  it('trims whitespace from name before passing to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue(mockCreatedCollection)
    await createCollection({ name: '  My Collection  ' })
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ name: 'My Collection' }),
    )
  })

  it('passes null description when description is empty string', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue(mockCreatedCollection)
    await createCollection({ name: 'My Collection', description: '' })
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ description: null }),
    )
  })

  it('passes description when provided', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockResolvedValue({ ...mockCreatedCollection, description: 'A description' })
    await createCollection({ name: 'My Collection', description: 'A description' })
    expect(mockDbCreate).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ description: 'A description' }),
    )
  })

  it('returns error when db throws', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbCreate.mockRejectedValue(new Error('DB error'))
    const result = await createCollection({ name: 'My Collection' })
    expect(result).toEqual({ success: false, error: 'Failed to create collection.' })
  })
})

describe('updateCollection server action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns not authenticated when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await updateCollection('col-1', { name: 'Updated' })
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('returns validation error when name is empty', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await updateCollection('col-1', { name: '' })
    expect(result.success).toBe(false)
    if (!result.success && typeof result.error !== 'string') {
      expect(result.error.name).toBeDefined()
    }
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('returns validation error when name is only whitespace', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await updateCollection('col-1', { name: '   ' })
    expect(result.success).toBe(false)
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('returns success on valid input', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue({ ...mockCreatedCollection, id: 'col-1', name: 'Updated' })
    const result = await updateCollection('col-1', { name: 'Updated' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Updated')
    }
  })

  it('passes collectionId and userId to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue({ ...mockCreatedCollection, id: 'col-1', name: 'Updated' })
    await updateCollection('col-1', { name: 'Updated' })
    expect(mockDbUpdate).toHaveBeenCalledWith('col-1', 'user-1', expect.any(Object))
  })

  it('trims whitespace from name', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue({ ...mockCreatedCollection, id: 'col-1', name: 'Updated' })
    await updateCollection('col-1', { name: '  Updated  ' })
    expect(mockDbUpdate).toHaveBeenCalledWith(
      'col-1',
      'user-1',
      expect.objectContaining({ name: 'Updated' }),
    )
  })

  it('converts empty description to null', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockResolvedValue({ ...mockCreatedCollection, id: 'col-1', description: null })
    await updateCollection('col-1', { name: 'Updated', description: '' })
    expect(mockDbUpdate).toHaveBeenCalledWith(
      'col-1',
      'user-1',
      expect.objectContaining({ description: null }),
    )
  })

  it('returns error when db throws', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbUpdate.mockRejectedValue(new Error('DB error'))
    const result = await updateCollection('col-1', { name: 'Updated' })
    expect(result).toEqual({ success: false, error: 'Failed to update collection.' })
  })
})

describe('deleteCollection server action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns not authenticated when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await deleteCollection('col-1')
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockDbDelete).not.toHaveBeenCalled()
  })

  it('returns success when collection is deleted', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbDelete.mockResolvedValue(mockCreatedCollection)
    const result = await deleteCollection('col-1')
    expect(result).toEqual({ success: true })
  })

  it('passes collectionId and userId to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbDelete.mockResolvedValue(mockCreatedCollection)
    await deleteCollection('col-1')
    expect(mockDbDelete).toHaveBeenCalledWith('col-1', 'user-1')
  })

  it('returns error when db throws', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbDelete.mockRejectedValue(new Error('DB error'))
    const result = await deleteCollection('col-1')
    expect(result).toEqual({ success: false, error: 'Failed to delete collection.' })
  })
})

describe('toggleCollectionFavorite server action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns not authenticated when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await toggleCollectionFavorite('col-1')
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockDbToggleFavorite).not.toHaveBeenCalled()
  })

  it('returns updated isFavorite true on success', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbToggleFavorite.mockResolvedValue(true)
    const result = await toggleCollectionFavorite('col-1')
    expect(result).toEqual({ success: true, data: { isFavorite: true } })
  })

  it('returns updated isFavorite false on success', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbToggleFavorite.mockResolvedValue(false)
    const result = await toggleCollectionFavorite('col-1')
    expect(result).toEqual({ success: true, data: { isFavorite: false } })
  })

  it('returns collection not found when db returns null', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbToggleFavorite.mockResolvedValue(null)
    const result = await toggleCollectionFavorite('col-1')
    expect(result).toEqual({ success: false, error: 'Collection not found.' })
  })

  it('passes collectionId and userId to db', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbToggleFavorite.mockResolvedValue(true)
    await toggleCollectionFavorite('col-1')
    expect(mockDbToggleFavorite).toHaveBeenCalledWith('col-1', 'user-1')
  })

  it('returns error when db throws', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockDbToggleFavorite.mockRejectedValue(new Error('DB error'))
    const result = await toggleCollectionFavorite('col-1')
    expect(result).toEqual({ success: false, error: 'Failed to update favorite.' })
  })
})
