'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetPassword } from '@/actions/password-reset'

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Invalid link</h1>
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid. Please request a new one.
        </p>
        <Link href="/forgot-password" className="block text-sm underline underline-offset-4 hover:text-foreground">
          Request new link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await resetPassword(token, password, confirmPassword)

    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.push('/sign-in?reset=true')
  }

  return (
    <div className="w-full max-w-sm space-y-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="text-sm text-muted-foreground">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </div>
  )
}
