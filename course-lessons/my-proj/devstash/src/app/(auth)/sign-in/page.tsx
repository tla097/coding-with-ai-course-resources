'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GithubIcon } from '@/components/ui/GithubIcon'

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const verified = searchParams.get('verified') === 'true'
  const reset = searchParams.get('reset') === 'true'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', { email, password, redirect: false })

    setLoading(false)

    if (result?.error) {
      setError(
        result.error === 'CredentialsSignin'
          ? 'Invalid email or password'
          : result.error,
      )
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-sm space-y-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => signIn('github', { callbackUrl: '/devstash/dashboard' })}
      >
        <GithubIcon className="mr-2 h-4 w-4" />
        Sign in with GitHub
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-background px-2">or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {verified && (
          <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
            Email verified! Sign in to continue.
          </p>
        )}
        {reset && (
          <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
            Password reset! Sign in with your new password.
          </p>
        )}
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="signin-password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                Forgot password?
              </Link>
            </div>
            <Input
              id="signin-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="underline underline-offset-4 hover:text-foreground">
          Register
        </Link>
      </p>
    </div>
  )
}