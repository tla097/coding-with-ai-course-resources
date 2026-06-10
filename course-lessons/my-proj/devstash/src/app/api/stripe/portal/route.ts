import { NextRequest } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return Response.json({ error: 'No billing account found' }, { status: 404 })
  }

  const origin = req.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? ''

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/settings`,
  })

  return Response.json({ url: portalSession.url })
}
