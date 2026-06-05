'use client'

import { useState } from 'react'
import { Pencil, Trash2, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EditCollectionDialog from '@/components/collections/EditCollectionDialog'
import DeleteCollectionDialog from '@/components/collections/DeleteCollectionDialog'

interface CollectionActionsProps {
  collection: { id: string; name: string; description: string | null }
}

export default function CollectionActions({ collection }: CollectionActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setEditOpen(true)}
          title="Edit collection"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setDeleteOpen(true)}
          title="Delete collection"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Favorite (coming soon)"
          disabled
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />
      <DeleteCollectionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collection={collection}
        redirectAfterDelete="/dashboard"
      />
    </>
  )
}
