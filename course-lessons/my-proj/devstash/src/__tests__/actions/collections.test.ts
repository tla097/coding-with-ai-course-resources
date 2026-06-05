import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db/collections', () => ({
  createCollection: vi.fn(),
  getRecentCollections: vi.fn(),
}))

import { createCollection } from '@/actions/collections'
import { auth } from '@/auth'
import { createCollection as dbCreateCollection } from '@/lib/db/collections'

const mockAuth = vi.mocked(auth)
const mockDbCreate = vi.mocked(dbCreateCollection)

const mockSession = { user: { id: 'user-1' } }

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
