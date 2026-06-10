import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
    customers: { retrieve: vi.fn() },
  },
}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { POST } from '@/app/api/webhooks/stripe/route'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

const mockConstructEvent = vi.mocked(stripe.webhooks.constructEvent)
const mockRetrieve = vi.mocked(stripe.customers.retrieve)
const mockFindUnique = vi.mocked(prisma.user.findUnique)
const mockUpdate = vi.mocked(prisma.user.update)

function makeRequest(body = 'raw-body', sig?: string) {
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: sig ? { 'stripe-signature': sig } : {},
    body,
  }) as unknown as import('next/server').NextRequest
}

function fakeCustomer(userId: string): Stripe.Customer {
  return { deleted: undefined, metadata: { userId } } as unknown as Stripe.Customer
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
})

describe('POST /api/webhooks/stripe', () => {
  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await POST(makeRequest('body', undefined))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/missing signature/i)
  })

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('Bad signature') })
    const res = await POST(makeRequest('body', 'bad-sig'))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/invalid signature/i)
  })

  describe('checkout.session.completed', () => {
    function makeCheckoutEvent(overrides: Partial<Stripe.Checkout.Session> = {}) {
      return {
        type: 'checkout.session.completed',
        data: {
          object: {
            mode: 'subscription',
            metadata: { userId: 'user-1' },
            customer: 'cus-abc',
            subscription: 'sub-abc',
            ...overrides,
          } as Stripe.Checkout.Session,
        },
      } as Stripe.Event
    }

    it('sets isPro=true, stripeCustomerId, and stripeSubscriptionId on first checkout (no stored customer)', async () => {
      mockConstructEvent.mockReturnValue(makeCheckoutEvent())
      mockFindUnique.mockResolvedValue({ id: 'user-1', stripeCustomerId: null } as never)
      mockUpdate.mockResolvedValue({} as never)

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isPro: true, stripeCustomerId: 'cus-abc', stripeSubscriptionId: 'sub-abc' },
      })
    })

    it('sets isPro=true when stored stripeCustomerId matches session.customer', async () => {
      mockConstructEvent.mockReturnValue(makeCheckoutEvent())
      mockFindUnique.mockResolvedValue({ id: 'user-1', stripeCustomerId: 'cus-abc' } as never)
      mockUpdate.mockResolvedValue({} as never)

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('does not update DB when stored stripeCustomerId does not match session.customer', async () => {
      mockConstructEvent.mockReturnValue(makeCheckoutEvent({ customer: 'cus-different' }))
      mockFindUnique.mockResolvedValue({ id: 'user-1', stripeCustomerId: 'cus-abc' } as never)

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('does not update DB when user is not found', async () => {
      mockConstructEvent.mockReturnValue(makeCheckoutEvent())
      mockFindUnique.mockResolvedValue(null as never)

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('does not update DB when session mode is not subscription', async () => {
      mockConstructEvent.mockReturnValue(makeCheckoutEvent({ mode: 'payment' }))

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('does not update DB when userId is missing from metadata', async () => {
      mockConstructEvent.mockReturnValue(makeCheckoutEvent({ metadata: {} }))

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('customer.subscription.updated', () => {
    it('sets isPro=true when status is active', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: { id: 'sub-1', customer: 'cus-1', status: 'active' } as Stripe.Subscription,
        },
      } as Stripe.Event)
      mockRetrieve.mockResolvedValue(fakeCustomer('user-1') as never)
      mockUpdate.mockResolvedValue({} as never)

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isPro: true, stripeSubscriptionId: 'sub-1' },
      })
    })

    it('sets isPro=true when status is trialing', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: { id: 'sub-1', customer: 'cus-1', status: 'trialing' } as Stripe.Subscription,
        },
      } as Stripe.Event)
      mockRetrieve.mockResolvedValue(fakeCustomer('user-1') as never)
      mockUpdate.mockResolvedValue({} as never)

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ isPro: true }),
      }))
    })

    it('sets isPro=false when status is past_due', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: { id: 'sub-1', customer: 'cus-1', status: 'past_due' } as Stripe.Subscription,
        },
      } as Stripe.Event)
      mockRetrieve.mockResolvedValue(fakeCustomer('user-1') as never)
      mockUpdate.mockResolvedValue({} as never)

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ isPro: false }),
      }))
    })

    it('does not update DB when customer is deleted', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: { id: 'sub-1', customer: 'cus-1', status: 'active' } as Stripe.Subscription,
        },
      } as Stripe.Event)
      mockRetrieve.mockResolvedValue({ deleted: true } as never)

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  describe('customer.subscription.deleted', () => {
    it('sets isPro=false and clears stripeSubscriptionId', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: { id: 'sub-1', customer: 'cus-1' } as Stripe.Subscription,
        },
      } as Stripe.Event)
      mockRetrieve.mockResolvedValue(fakeCustomer('user-1') as never)
      mockUpdate.mockResolvedValue({} as never)

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isPro: false, stripeSubscriptionId: null },
      })
    })

    it('does not update DB when customer is deleted', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: { id: 'sub-1', customer: 'cus-1' } as Stripe.Subscription,
        },
      } as Stripe.Event)
      mockRetrieve.mockResolvedValue({ deleted: true } as never)

      const res = await POST(makeRequest('body', 't=1,v1=sig'))
      expect(res.status).toBe(200)
      expect(mockUpdate).not.toHaveBeenCalled()
    })
  })

  it('returns 200 received:true on success', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub-1', customer: 'cus-1' } as Stripe.Subscription },
    } as Stripe.Event)
    mockRetrieve.mockResolvedValue(fakeCustomer('user-1') as never)
    mockUpdate.mockResolvedValue({} as never)

    const res = await POST(makeRequest('body', 't=1,v1=sig'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.received).toBe(true)
  })
})
