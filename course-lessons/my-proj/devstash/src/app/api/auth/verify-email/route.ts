import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    redirect('/verify-email')
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record) {
    redirect('/verify-email?error=invalid')
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token } })
    redirect('/verify-email?error=expired')
  }

  await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  })
  await prisma.verificationToken.deleteMany({ where: { token } })

  redirect('/sign-in?verified=true')
}
