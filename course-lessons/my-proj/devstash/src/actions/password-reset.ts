'use server'

import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { headers } from 'next/headers'
import { checkRateLimit, formatRateLimitError, getIpFromHeaders } from '@/lib/rate-limit'
import { validateNewPassword } from '@/lib/actions/validate-password'

const IDENTIFIER_PREFIX = 'password-reset:'

export async function requestPasswordReset(email: string) {
  const headersList = await headers()
  const ip = getIpFromHeaders(headersList)
  const limit = await checkRateLimit(`forgot-password:${ip}`, 3, '1 h')
  if (!limit.success) {
    return { success: false, error: formatRateLimitError(limit.reset) }
  }

  const user = await prisma.user.findUnique({ where: { email } })

  // Always return success to avoid email enumeration
  if (!user || !user.password) {
    return { success: true }
  }

  // Delete any existing reset token for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: IDENTIFIER_PREFIX + email },
  })

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.verificationToken.create({
    data: { identifier: IDENTIFIER_PREFIX + email, token, expires },
  })

  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const resetUrl = `${protocol}://${host}/devstash/reset-password?token=${token}`

  await sendPasswordResetEmail(email, resetUrl)

  return { success: true }
}

export async function resetPassword(token: string, password: string, confirmPassword: string) {
  const headersList = await headers()
  const ip = getIpFromHeaders(headersList)
  const limit = await checkRateLimit(`reset-password:${ip}`, 5, '15 m')
  if (!limit.success) {
    return { success: false, error: formatRateLimitError(limit.reset) }
  }

  if (!token) {
    return { success: false, error: 'Invalid or missing token.' }
  }

  const pwValidation = validateNewPassword(password, confirmPassword)
  if (!pwValidation.ok) return { success: false, error: pwValidation.error }

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record || !record.identifier.startsWith(IDENTIFIER_PREFIX)) {
    return { success: false, error: 'This reset link is invalid or has already been used.' }
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token } })
    return { success: false, error: 'This reset link has expired. Please request a new one.' }
  }

  const email = record.identifier.slice(IDENTIFIER_PREFIX.length)
  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  })

  await prisma.verificationToken.deleteMany({ where: { token } })

  return { success: true }
}
