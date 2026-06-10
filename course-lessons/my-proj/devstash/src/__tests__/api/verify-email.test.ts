import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url })
  }),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    verificationToken: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}))

import { GET } from '@/app/api/auth/verify-email/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

const mockFindUnique = vi.mocked(prisma.verificationToken.findUnique)
const mockDeleteMany = vi.mocked(prisma.verificationToken.deleteMany)
const mockUserUpdate = vi.mocked(prisma.user.update)
const mockRedirect = vi.mocked(redirect)

function makeRequest(token: string | null) {
  const url = token
    ? `http://localhost/api/auth/verify-email?token=${token}`
    : 'http://localhost/api/auth/verify-email'
  return new NextRequest(url)
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/auth/verify-email', () => {
  it('redirects to /verify-email when no token is provided', async () => {
    await expect(GET(makeRequest(null))).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/verify-email')
  })

  it('redirects to /verify-email?error=invalid when token is not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    await expect(GET(makeRequest('bad-token'))).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/verify-email?error=invalid')
  })

  it('deletes expired token and redirects to /verify-email?error=expired', async () => {
    const expired = new Date(Date.now() - 1000)
    mockFindUnique.mockResolvedValue({ token: 'tok', identifier: 'user@example.com', expires: expired })

    await expect(GET(makeRequest('tok'))).rejects.toThrow('NEXT_REDIRECT')
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { token: 'tok' } })
    expect(mockRedirect).toHaveBeenCalledWith('/verify-email?error=expired')
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })

  it('updates emailVerified, deletes token, and redirects to /sign-in?verified=true on valid token', async () => {
    const future = new Date(Date.now() + 86400000)
    mockFindUnique.mockResolvedValue({ token: 'valid-tok', identifier: 'user@example.com', expires: future })
    mockUserUpdate.mockResolvedValue({} as never)
    mockDeleteMany.mockResolvedValue({ count: 1 })

    await expect(GET(makeRequest('valid-tok'))).rejects.toThrow('NEXT_REDIRECT')

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      data: { emailVerified: expect.any(Date) },
    })
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { token: 'valid-tok' } })
    expect(mockRedirect).toHaveBeenCalledWith('/sign-in?verified=true')
  })

  it('does not update user for an expired token', async () => {
    const expired = new Date(Date.now() - 1)
    mockFindUnique.mockResolvedValue({ token: 'exp-tok', identifier: 'user@example.com', expires: expired })

    await expect(GET(makeRequest('exp-tok'))).rejects.toThrow('NEXT_REDIRECT')
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })
})
