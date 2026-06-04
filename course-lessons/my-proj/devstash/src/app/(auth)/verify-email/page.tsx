import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import ResendVerificationForm from './ResendVerificationForm'

interface Props {
  searchParams: Promise<{ token?: string; pending?: string }>
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token, pending } = await searchParams

  if (token) {
    const record = await prisma.verificationToken.findUnique({ where: { token } })

    if (!record) {
      return <VerifyResult error="This verification link is invalid or has already been used." />
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { token } })
      return <VerifyResult error="This verification link has expired. Please register again." />
    }

    await prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    })
    await prisma.verificationToken.deleteMany({ where: { token } })

    redirect('/sign-in?verified=true')
  }

  return (
    <div className="w-full max-w-sm space-y-4 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p className="text-sm text-muted-foreground">
        {pending
          ? "A verification link has been sent to your email address. Click it to activate your account."
          : "A verification email has been sent to your address."}
      </p>
      <p className="text-xs text-muted-foreground">The link expires in 24 hours.</p>
      <ResendVerificationForm />
      <Link href="/sign-in" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
        Back to sign in
      </Link>
    </div>
  )
}

function VerifyResult({ error }: { error: string }) {
  return (
    <div className="w-full max-w-sm space-y-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Verification failed</h1>
      <p className="text-sm text-muted-foreground">{error}</p>
      <Link href="/register" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
        Back to register
      </Link>
    </div>
  )
}