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
import { deleteCollection } from '@/actions/collections'
import { getActionErrorMessage } from '@/lib/actions/action-error'
import { useDialogSubmit } from '@/hooks/useDialogSubmit'

interface DeleteCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: { id: string; name: string }
  redirectAfterDelete?: string
}

export default function DeleteCollectionDialog({
  open,
  onOpenChange,
  collection,
  redirectAfterDelete,
}: DeleteCollectionDialogProps) {
  const router = useRouter()
  const { inProgress: deleting, setInProgress: setDeleting, guardedOpenChange } = useDialogSubmit()

  function handleOpenChange(value: boolean) {
    guardedOpenChange(value, onOpenChange)
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteCollection(collection.id)
    setDeleting(false)

    if (!result.success) {
      toast.error(getActionErrorMessage(result.error, 'Failed to delete collection.'))
      return
    }

    toast.success('Collection deleted')
    onOpenChange(false)
    if (redirectAfterDelete) {
      router.push(redirectAfterDelete)
    } else {
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!deleting}>
        <DialogHeader>
          <DialogTitle>Delete Collection</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{' '}
          <span className="font-medium text-foreground">{collection.name}</span>? The items inside
          will not be deleted.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
