import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({ toString: () => 'mocked_token_hex_64chars_placeholder_value' })),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    verificationToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/email', () => ({
  sendVerificationEmail: vi.fn(),
}))

import { issueVerificationToken } from '@/lib/auth-tokens'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

const mockDeleteMany = vi.mocked(prisma.verificationToken.deleteMany)
const mockCreate = vi.mocked(prisma.verificationToken.create)
const mockSendEmail = vi.mocked(sendVerificationEmail)

beforeEach(() => vi.clearAllMocks())

describe('issueVerificationToken', () => {
  const email = 'user@example.com'
  const name = 'Test User'
  const baseUrl = 'http://localhost:3000'

  it('creates a verification token and sends an email', async () => {
    mockCreate.mockResolvedValue({} as never)
    mockSendEmail.mockResolvedValue(undefined)

    await issueVerificationToken(email, name, baseUrl)

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        identifier: email,
        token: expect.any(String),
        expires: expect.any(Date),
      },
    })
    expect(mockSendEmail).toHaveBeenCalledWith(
      email,
      name,
      expect.stringContaining('/api/auth/verify-email?token='),
    )
  })

  it('constructs the verifyUrl from baseUrl', async () => {
    mockCreate.mockResolvedValue({} as never)
    mockSendEmail.mockResolvedValue(undefined)

    await issueVerificationToken(email, name, baseUrl)

    const [, , verifyUrl] = mockSendEmail.mock.calls[0]
    expect(verifyUrl).toMatch(/^http:\/\/localhost:3000\/api\/auth\/verify-email\?token=/)
  })

  it('sets expiry ~24 hours from now', async () => {
    mockCreate.mockResolvedValue({} as never)
    mockSendEmail.mockResolvedValue(undefined)

    const before = Date.now()
    await issueVerificationToken(email, name, baseUrl)
    const after = Date.now()

    const { expires } = mockCreate.mock.calls[0][0].data
    const expiresMs = (expires as Date).getTime()
    const expectedMin = before + 24 * 60 * 60 * 1000
    const expectedMax = after + 24 * 60 * 60 * 1000

    expect(expiresMs).toBeGreaterThanOrEqual(expectedMin)
    expect(expiresMs).toBeLessThanOrEqual(expectedMax)
  })

  it('does NOT call deleteMany by default', async () => {
    mockCreate.mockResolvedValue({} as never)
    mockSendEmail.mockResolvedValue(undefined)

    await issueVerificationToken(email, name, baseUrl)

    expect(mockDeleteMany).not.toHaveBeenCalled()
  })

  it('calls deleteMany when deleteExisting=true', async () => {
    mockDeleteMany.mockResolvedValue({ count: 1 })
    mockCreate.mockResolvedValue({} as never)
    mockSendEmail.mockResolvedValue(undefined)

    await issueVerificationToken(email, name, baseUrl, true)

    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { identifier: email } })
  })

  it('still creates token and sends email when deleteExisting=true', async () => {
    mockDeleteMany.mockResolvedValue({ count: 1 })
    mockCreate.mockResolvedValue({} as never)
    mockSendEmail.mockResolvedValue(undefined)

    await issueVerificationToken(email, name, baseUrl, true)

    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  it('calls deleteMany before create', async () => {
    const callOrder: string[] = []
    mockDeleteMany.mockImplementation(async () => { callOrder.push('deleteMany'); return { count: 1 } })
    mockCreate.mockImplementation(async () => { callOrder.push('create'); return {} as never })
    mockSendEmail.mockResolvedValue(undefined)

    await issueVerificationToken(email, name, baseUrl, true)

    expect(callOrder).toEqual(['deleteMany', 'create'])
  })
})
