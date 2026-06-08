import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

import { updateEditorPreferences, getEditorPreferences } from '@/actions/editor-preferences'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_EDITOR_PREFERENCES } from '@/types/editor-preferences'

const mockAuth = vi.mocked(auth)
const mockUpdate = vi.mocked(prisma.user.update)
const mockFindUnique = vi.mocked(prisma.user.findUnique)

const mockSession = { user: { id: 'user-1' } }

const validPreferences = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: 'vs-dark' as const,
}

// ─── updateEditorPreferences ──────────────────────────────────────────────────

describe('updateEditorPreferences', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns not authenticated when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await updateEditorPreferences(validPreferences)
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns not authenticated when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)
    const result = await updateEditorPreferences(validPreferences)
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns invalid when input is missing required fields', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await updateEditorPreferences({ fontSize: 14 })
    expect(result).toEqual({ success: false, error: 'Invalid preferences.' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns invalid when font size is out of range', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await updateEditorPreferences({ ...validPreferences, fontSize: 5 })
    expect(result).toEqual({ success: false, error: 'Invalid preferences.' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns invalid when tab size is not an allowed value', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await updateEditorPreferences({ ...validPreferences, tabSize: 3 })
    expect(result).toEqual({ success: false, error: 'Invalid preferences.' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns invalid when theme is not an allowed value', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    const result = await updateEditorPreferences({ ...validPreferences, theme: 'solarized' })
    expect(result).toEqual({ success: false, error: 'Invalid preferences.' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('updates user and returns success on valid input', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockUpdate.mockResolvedValue({} as never)
    const result = await updateEditorPreferences(validPreferences)
    expect(result).toEqual({ success: true })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { editorPreferences: validPreferences },
    })
  })

  it('accepts all valid theme options', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockUpdate.mockResolvedValue({} as never)
    for (const theme of ['vs-dark', 'monokai', 'github-dark'] as const) {
      const result = await updateEditorPreferences({ ...validPreferences, theme })
      expect(result).toEqual({ success: true })
    }
  })
})

// ─── getEditorPreferences ─────────────────────────────────────────────────────

describe('getEditorPreferences', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns defaults when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await getEditorPreferences()
    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES)
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('returns defaults when user has no stored preferences', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockFindUnique.mockResolvedValue({ editorPreferences: null } as never)
    const result = await getEditorPreferences()
    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES)
  })

  it('returns defaults when stored preferences fail validation', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockFindUnique.mockResolvedValue({
      editorPreferences: { fontSize: 'not-a-number' },
    } as never)
    const result = await getEditorPreferences()
    expect(result).toEqual(DEFAULT_EDITOR_PREFERENCES)
  })

  it('returns stored preferences when valid', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockFindUnique.mockResolvedValue({ editorPreferences: validPreferences } as never)
    const result = await getEditorPreferences()
    expect(result).toEqual(validPreferences)
  })

  it('queries the correct user', async () => {
    mockAuth.mockResolvedValue(mockSession as never)
    mockFindUnique.mockResolvedValue({ editorPreferences: null } as never)
    await getEditorPreferences()
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { editorPreferences: true },
    })
  })
})
