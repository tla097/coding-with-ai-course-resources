import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}))
vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
  },
}))

import { POST } from '@/app/api/stripe/checkout/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

const mockAuth = vi.mocked(auth)
const mockFindUnique = vi.mocked(prisma.user.findUnique)
const mockUpdate = vi.mocked(prisma.user.update)
const mockCustomersCreate = vi.mocked(stripe.customers.create)
const mockSessionsCreate = vi.mocked(stripe.checkout.sessions.create)

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: 'http://localhost:3000' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

const MONTHLY = 'price_monthly'
const YEARLY = 'price_yearly'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY = MONTHLY
  process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY = YEARLY
})

describe('POST /api/stripe/checkout', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({ priceId: MONTHLY }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when priceId is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/invalid price/i)
  })

  it('returns 400 when priceId is not a known price', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    const res = await POST(makeRequest({ priceId: 'price_bogus' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when user not found in DB', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockFindUnique.mockResolvedValue(null)
    const res = await POST(makeRequest({ priceId: MONTHLY }))
    expect(res.status).toBe(404)
  })

  it('creates a Stripe customer when stripeCustomerId is null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockFindUnique.mockResolvedValue({ email: 'test@test.com', stripeCustomerId: null } as never)
    mockUpdate.mockResolvedValue({} as never)
    mockCustomersCreate.mockResolvedValue({ id: 'cus_new' } as Stripe.Customer)
    mockSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test' } as Stripe.Checkout.Session)

    const res = await POST(makeRequest({ priceId: MONTHLY }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test')
    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: 'test@test.com',
      metadata: { userId: 'user-1' },
    })
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: { stripeCustomerId: 'cus_new' },
    }))
  })

  it('reuses existing stripeCustomerId without creating a new customer', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockFindUnique.mockResolvedValue({ email: 'test@test.com', stripeCustomerId: 'cus_existing' } as never)
    mockSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test' } as Stripe.Checkout.Session)

    const res = await POST(makeRequest({ priceId: YEARLY }))
    expect(res.status).toBe(200)
    expect(mockCustomersCreate).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
    const data = await res.json()
    expect(data.url).toBeDefined()
  })

  it('passes userId in checkout session metadata', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockFindUnique.mockResolvedValue({ email: 'test@test.com', stripeCustomerId: 'cus_existing' } as never)
    mockSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/cs_test' } as Stripe.Checkout.Session)

    await POST(makeRequest({ priceId: MONTHLY }))
    expect(mockSessionsCreate).toHaveBeenCalledWith(expect.objectContaining({
      metadata: { userId: 'user-1' },
    }))
  })
})
