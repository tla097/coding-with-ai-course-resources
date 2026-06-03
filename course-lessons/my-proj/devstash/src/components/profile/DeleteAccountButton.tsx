'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { deleteAccount } from '@/actions/profile'

export default function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setError('')
    setLoading(true)

    const result = await deleteAccount()

    if (!result.success) {
      setLoading(false)
      setError(result.error ?? 'Something went wrong.')
      return
    }

    await signOut({ callbackUrl: '/sign-in' })
  }

  return (
    <div className="rounded-lg border border-destructive/30 bg-card p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-destructive">Delete Account</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
      </div>

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
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={loading}
              onClick={handleDelete}
            >
              {loading ? 'Deleting…' : 'Yes, delete my account'}
            </Button>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
