import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
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

  // Delete any existing verification token for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  const baseUrl = new URL(req.url).origin
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`

  if (process.env.NODE_ENV === 'development') {
    console.log(`\n[resend-verification] ${verifyUrl}\n`)
  }

  await sendVerificationEmail(email, user.name ?? 'there', verifyUrl)

  return Response.json({ success: true })
}