'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateName } from '@/actions/profile'

interface Props {
  currentName: string | null
}

export default function EditNameForm({ currentName }: Props) {
  const router = useRouter()
  const [name, setName] = useState(currentName ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const result = await updateName(name)
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : 'Failed to update name.')
        return
      }
      toast.success('Name updated')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <h2 className="text-base font-semibold">Display Name</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="display-name">Name</Label>
          <Input
            id="display-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            maxLength={100}
          />
        </div>
        <Button type="submit" size="sm" disabled={saving || name.trim() === (currentName ?? '')}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </div>
  )
}
