'use server'

import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { headers } from 'next/headers'
import { checkRateLimit, getIpFromHeaders } from '@/lib/rate-limit'

const IDENTIFIER_PREFIX = 'password-reset:'

export async function requestPasswordReset(email: string) {
  const headersList = await headers()
  const ip = getIpFromHeaders(headersList)
  const limit = await checkRateLimit(`forgot-password:${ip}`, 3, '1 h')
  if (!limit.success) {
    const minutes = Math.max(1, Math.ceil(Math.max(0, limit.reset - Date.now()) / 60000))
    return { success: false, error: `Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` }
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
  const resetUrl = `${protocol}://${host}/reset-password?token=${token}`

  if (process.env.NODE_ENV === 'development') {
    console.log(`\n[reset-password] ${resetUrl}\n`)
  }

  await sendPasswordResetEmail(email, resetUrl)

  return { success: true }
}

export async function resetPassword(token: string, password: string, confirmPassword: string) {
  const headersList = await headers()
  const ip = getIpFromHeaders(headersList)
  const limit = await checkRateLimit(`reset-password:${ip}`, 5, '15 m')
  if (!limit.success) {
    const minutes = Math.max(1, Math.ceil(Math.max(0, limit.reset - Date.now()) / 60000))
    return { success: false, error: `Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` }
  }

  if (!token) {
    return { success: false, error: 'Invalid or missing token.' }
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' }
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }

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
