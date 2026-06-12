'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deleteAccount } from '@/actions/profile'

interface Props {
  hasPassword: boolean
}

export default function DeleteAccountButton({ hasPassword }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleCancel() {
    setConfirming(false)
    setConfirmation('')
    setError('')
  }

  async function handleDelete() {
    setError('')
    setLoading(true)

    const result = await deleteAccount(confirmation)

    if (!result.success) {
      setLoading(false)
      setError(result.error ?? 'Something went wrong.')
      return
    }

    await signOut({ callbackUrl: '/devstash/sign-in' })
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!confirming ? (
        <Button variant="destructive" onClick={() => setConfirming(true)}>
          Delete account
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Are you sure? All your items, collections, and data will be permanently deleted.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="delete-confirmation" className="text-sm text-muted-foreground">
              {hasPassword
                ? 'Enter your current password to confirm'
                : 'Type your email address to confirm'}
            </Label>
            <Input
              id="delete-confirmation"
              type={hasPassword ? 'password' : 'email'}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={hasPassword ? 'Current password' : 'your@email.com'}
              disabled={loading}
              className="max-w-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={loading || !confirmation}
              onClick={handleDelete}
            >
              {loading ? 'Deleting…' : 'Yes, delete my account'}
            </Button>
            <Button
              variant="outline"
              disabled={loading}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
