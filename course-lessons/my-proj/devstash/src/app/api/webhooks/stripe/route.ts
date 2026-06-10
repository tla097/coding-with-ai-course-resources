import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return Response.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.userId
        if (!userId) break

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, stripeCustomerId: true },
        })
        if (!user) break

        // On first checkout stripeCustomerId may be null — allow it through.
        // On subsequent events the stored ID must match the Stripe customer.
        if (user.stripeCustomerId && user.stripeCustomerId !== session.customer) break

        await prisma.user.update({
          where: { id: userId },
          data: {
            isPro: true,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
        })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        if (customer.deleted) break

        const userId = (customer as Stripe.Customer).metadata?.userId
        if (!userId) break

        const isActive =
          subscription.status === 'active' || subscription.status === 'trialing'

        await prisma.user.update({
          where: { id: userId },
          data: {
            isPro: isActive,
            stripeSubscriptionId: subscription.id,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        if (customer.deleted) break

        const userId = (customer as Stripe.Customer).metadata?.userId
        if (!userId) break

        await prisma.user.update({
          where: { id: userId },
          data: {
            isPro: false,
            stripeSubscriptionId: null,
          },
        })
        break
      }
    }
  } catch {
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return Response.json({ received: true })
}
