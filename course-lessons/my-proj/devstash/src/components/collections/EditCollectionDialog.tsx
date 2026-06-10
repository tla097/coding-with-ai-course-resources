'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateCollection } from '@/actions/collections'
import { getActionErrorMessage } from '@/lib/actions/action-error'
import { useDialogSubmit } from '@/hooks/useDialogSubmit'

interface EditCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: { id: string; name: string; description: string | null }
}

export default function EditCollectionDialog({
  open,
  onOpenChange,
  collection,
}: EditCollectionDialogProps) {
  const router = useRouter()
  const [name, setName] = useState(collection.name)
  const [description, setDescription] = useState(collection.description ?? '')
  const { inProgress: saving, setInProgress: setSaving, guardedOpenChange } = useDialogSubmit()

  function handleOpenChange(value: boolean) {
    guardedOpenChange(value, v => {
      if (!v) {
        setName(collection.name)
        setDescription(collection.description ?? '')
      }
      onOpenChange(v)
    })
  }

  const canSubmit = name.trim().length > 0

  async function handleSubmit() {
    if (!canSubmit) return
    setSaving(true)

    const result = await updateCollection(collection.id, {
      name,
      description: description || null,
    })

    setSaving(false)

    if (!result.success) {
      toast.error(getActionErrorMessage(result.error, 'Validation failed. Please check your inputs.'))
      return
    }

    toast.success('Collection updated')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-col-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-col-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. React Patterns"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-col-description">Description</Label>
            <Textarea
              id="edit-col-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
