import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))

import { requireApiAuth } from '@/lib/api-auth'
import { auth } from '@/auth'

const mockAuth = vi.mocked(auth)

beforeEach(() => vi.clearAllMocks())

describe('requireApiAuth', () => {
  it('returns 401 error response when session is null', async () => {
    mockAuth.mockResolvedValue(null)

    const result = await requireApiAuth()

    expect(result.session).toBeNull()
    expect(result.error).toBeInstanceOf(Response)
    expect(result.error!.status).toBe(401)
  })

  it('returns 401 error response when session has no user', async () => {
    mockAuth.mockResolvedValue({ user: undefined } as never)

    const result = await requireApiAuth()

    expect(result.session).toBeNull()
    expect(result.error!.status).toBe(401)
  })

  it('returns 401 error response when user.id is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: '' } } as never)

    const result = await requireApiAuth()

    expect(result.session).toBeNull()
    expect(result.error!.status).toBe(401)
  })

  it('returns session with null error when authenticated', async () => {
    const session = { user: { id: 'user-1', isPro: false } }
    mockAuth.mockResolvedValue(session as never)

    const result = await requireApiAuth()

    expect(result.error).toBeNull()
    expect(result.session).not.toBeNull()
    expect(result.session!.user.id).toBe('user-1')
  })

  it('401 response body contains Unauthorized error message', async () => {
    mockAuth.mockResolvedValue(null)

    const result = await requireApiAuth()
    const body = await result.error!.json()

    expect(body.error).toMatch(/unauthorized/i)
  })
})
