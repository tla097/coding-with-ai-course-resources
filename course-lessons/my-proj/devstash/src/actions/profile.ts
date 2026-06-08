'use server'

import bcrypt from 'bcryptjs'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function updateName(name: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated.' }

  const trimmed = name.trim()
  if (!trimmed) return { success: false, error: 'Name cannot be empty.' }
  if (trimmed.length > 100) return { success: false, error: 'Name too long.' }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: trimmed },
  })

  return { success: true }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated.' }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' }
  }
  if (newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user?.password) {
    return { success: false, error: 'Password change is not available for this account.' }
  }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    return { success: false, error: 'Current password is incorrect.' }
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  })

  return { success: true }
}

export async function deleteAccount() {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Not authenticated.' }

  await prisma.user.delete({ where: { id: session.user.id } })

  return { success: true }
}
