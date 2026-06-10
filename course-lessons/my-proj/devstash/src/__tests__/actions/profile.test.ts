import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

import { deleteAccount } from '@/actions/profile'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const mockAuth = vi.mocked(auth)
const mockFindUnique = vi.mocked(prisma.user.findUnique)
const mockDelete = vi.mocked(prisma.user.delete)
const mockBcryptCompare = vi.mocked(bcrypt.compare)

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: 'user-1', email: 'tom@example.com' } } as never)
  mockDelete.mockResolvedValue({} as never)
})

describe('deleteAccount', () => {
  describe('unauthenticated', () => {
    it('returns error when not authenticated', async () => {
      mockAuth.mockResolvedValue(null as never)
      const result = await deleteAccount('anything')
      expect(result).toEqual({ success: false, error: 'Not authenticated.' })
      expect(mockDelete).not.toHaveBeenCalled()
    })
  })

  describe('credentials user (has password)', () => {
    beforeEach(() => {
      mockFindUnique.mockResolvedValue({
        email: 'tom@example.com',
        password: 'hashed-password',
      } as never)
    })

    it('deletes account when correct password is provided', async () => {
      mockBcryptCompare.mockResolvedValue(true as never)
      const result = await deleteAccount('correct-password')
      expect(result).toEqual({ success: true })
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'user-1' } })
    })

    it('returns error when password is incorrect', async () => {
      mockBcryptCompare.mockResolvedValue(false as never)
      const result = await deleteAccount('wrong-password')
      expect(result).toEqual({ success: false, error: 'Incorrect password.' })
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('calls bcrypt.compare with the provided password and stored hash', async () => {
      mockBcryptCompare.mockResolvedValue(true as never)
      await deleteAccount('my-password')
      expect(mockBcryptCompare).toHaveBeenCalledWith('my-password', 'hashed-password')
    })
  })

  describe('OAuth user (no password)', () => {
    beforeEach(() => {
      mockFindUnique.mockResolvedValue({
        email: 'tom@example.com',
        password: null,
      } as never)
    })

    it('deletes account when correct email is provided', async () => {
      const result = await deleteAccount('tom@example.com')
      expect(result).toEqual({ success: true })
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'user-1' } })
    })

    it('deletes account when email matches case-insensitively', async () => {
      const result = await deleteAccount('TOM@EXAMPLE.COM')
      expect(result).toEqual({ success: true })
      expect(mockDelete).toHaveBeenCalled()
    })

    it('deletes account when email has surrounding whitespace', async () => {
      const result = await deleteAccount('  tom@example.com  ')
      expect(result).toEqual({ success: true })
      expect(mockDelete).toHaveBeenCalled()
    })

    it('returns error when email does not match', async () => {
      const result = await deleteAccount('other@example.com')
      expect(result).toEqual({ success: false, error: 'Email address does not match.' })
      expect(mockDelete).not.toHaveBeenCalled()
    })
  })

  describe('user not found', () => {
    it('returns error when user record is missing', async () => {
      mockFindUnique.mockResolvedValue(null as never)
      const result = await deleteAccount('anything')
      expect(result).toEqual({ success: false, error: 'User not found.' })
      expect(mockDelete).not.toHaveBeenCalled()
    })
  })
})
