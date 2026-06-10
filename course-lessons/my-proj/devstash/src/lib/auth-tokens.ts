import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

export async function issueVerificationToken(
  email: string,
  name: string,
  baseUrl: string,
  deleteExisting = false,
): Promise<void> {
  if (deleteExisting) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
  }
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`
  await sendVerificationEmail(email, name, verifyUrl)
}
