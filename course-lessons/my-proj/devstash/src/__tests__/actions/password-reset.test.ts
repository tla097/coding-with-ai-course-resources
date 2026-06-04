import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue(null) }),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 5, reset: 0 }),
  getIpFromHeaders: vi.fn().mockReturnValue('127.0.0.1'),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    verificationToken: {
      findUnique: vi.fn(),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}))

vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}))

import { resetPassword } from '@/actions/password-reset'

describe('resetPassword', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when token is empty', async () => {
    const result = await resetPassword('', 'password123', 'password123')
    expect(result).toEqual({ success: false, error: 'Invalid or missing token.' })
  })

  it('returns error when passwords do not match', async () => {
    const result = await resetPassword('tok', 'password123', 'different')
    expect(result).toEqual({ success: false, error: 'Passwords do not match.' })
  })

  it('returns error when password is too short', async () => {
    const result = await resetPassword('tok', 'short', 'short')
    expect(result).toEqual({ success: false, error: 'Password must be at least 8 characters.' })
  })

  it('returns error when token not found in DB', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(null)
    const result = await resetPassword('bad-token', 'password123', 'password123')
    expect(result).toEqual({ success: false, error: 'This reset link is invalid or has already been used.' })
  })

  it('returns error when token is expired', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
      identifier: 'password-reset:test@example.com',
      token: 'expired-token',
      expires: new Date('2020-01-01'),
    })
    const result = await resetPassword('expired-token', 'password123', 'password123')
    expect(result).toEqual({ success: false, error: 'This reset link has expired. Please request a new one.' })
  })

  it('returns success when token is valid and passwords match', async () => {
    const { prisma } = await import('@/lib/prisma')
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
      identifier: 'password-reset:test@example.com',
      token: 'valid-token',
      expires: new Date('2099-01-01'),
    })
    const result = await resetPassword('valid-token', 'password123', 'password123')
    expect(result).toEqual({ success: true })
  })
})
