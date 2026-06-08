import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}))
vi.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: { sessions: { create: vi.fn() } },
  },
}))

import { POST } from '@/app/api/stripe/portal/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

const mockAuth = vi.mocked(auth)
const mockFindUnique = vi.mocked(prisma.user.findUnique)
const mockPortalCreate = vi.mocked(stripe.billingPortal.sessions.create)

function makeRequest() {
  return new Request('http://localhost/api/stripe/portal', {
    method: 'POST',
    headers: { origin: 'http://localhost:3000' },
  }) as unknown as import('next/server').NextRequest
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/stripe/portal', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 404 when user has no stripeCustomerId', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockFindUnique.mockResolvedValue({ stripeCustomerId: null } as never)
    const res = await POST(makeRequest())
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toMatch(/billing account/i)
  })

  it('returns 404 when user not found in DB', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockFindUnique.mockResolvedValue(null)
    const res = await POST(makeRequest())
    expect(res.status).toBe(404)
  })

  it('returns portal URL for a user with a Stripe customer', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockFindUnique.mockResolvedValue({ stripeCustomerId: 'cus_existing' } as never)
    mockPortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/session/test' } as Stripe.BillingPortal.Session)

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toBe('https://billing.stripe.com/session/test')
  })

  it('passes the correct customerId and return_url to Stripe', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockFindUnique.mockResolvedValue({ stripeCustomerId: 'cus_existing' } as never)
    mockPortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/session/test' } as Stripe.BillingPortal.Session)

    await POST(makeRequest())
    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: 'cus_existing',
      return_url: expect.stringContaining('/settings'),
    })
  })
})
