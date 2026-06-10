'use server'

import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/actions/require-auth'
import { validateNewPassword } from '@/lib/actions/validate-password'
import { prisma } from '@/lib/prisma'

export async function updateName(name: string) {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const trimmed = name.trim()
  if (!trimmed) return { success: false as const, error: 'Name cannot be empty.' }
  if (trimmed.length > 100) return { success: false as const, error: 'Name too long.' }

  await prisma.user.update({
    where: { id: authResult.userId },
    data: { name: trimmed },
  })

  return { success: true }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const pwValidation = validateNewPassword(newPassword, confirmPassword)
  if (!pwValidation.ok) return { success: false as const, error: pwValidation.error }

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { password: true },
  })

  if (!user?.password) {
    return { success: false as const, error: 'Password change is not available for this account.' }
  }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    return { success: false as const, error: 'Current password is incorrect.' }
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: authResult.userId },
    data: { password: hashed },
  })

  return { success: true }
}

export async function deleteAccount(confirmation: string) {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { email: true, password: true },
  })
  if (!user) return { success: false as const, error: 'User not found.' }

  if (user.password) {
    // Credentials user — verify current password
    const valid = await bcrypt.compare(confirmation, user.password)
    if (!valid) return { success: false as const, error: 'Incorrect password.' }
  } else {
    // OAuth user — require typing their email address
    if (confirmation.trim().toLowerCase() !== user.email?.toLowerCase()) {
      return { success: false as const, error: 'Email address does not match.' }
    }
  }

  await prisma.user.delete({ where: { id: authResult.userId } })

  return { success: true }
}
