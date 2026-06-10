import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { issueVerificationToken } from '@/lib/auth-tokens'
import { checkRateLimit, getIpFromHeaders, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = getIpFromHeaders(req.headers)

  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return Response.json({ error: 'Email is required.' }, { status: 400 })
  }

  const limit = await checkRateLimit(`resend-verification:${ip}:${email}`, 3, '15 m')
  if (!limit.success) return rateLimitResponse(limit.reset)

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, emailVerified: true },
  })

  // Always return success to avoid user enumeration
  if (!user || user.emailVerified) {
    return Response.json({ success: true })
  }

  const baseUrl = new URL(req.url).origin
  await issueVerificationToken(email, user.name ?? 'there', baseUrl, true)

  return Response.json({ success: true })
}
