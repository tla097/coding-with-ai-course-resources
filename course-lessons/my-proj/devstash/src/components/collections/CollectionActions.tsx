'use client'

import { useState } from 'react'
import { Pencil, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EditCollectionDialog from '@/components/collections/EditCollectionDialog'
import DeleteCollectionDialog from '@/components/collections/DeleteCollectionDialog'
import { toggleCollectionFavorite } from '@/actions/collections'
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle'

interface CollectionActionsProps {
  collection: { id: string; name: string; description: string | null; isFavorite: boolean }
}

export default function CollectionActions({ collection }: CollectionActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { isFavorite, favoriting, toggle: handleToggleFavorite } = useFavoriteToggle(
    collection.isFavorite,
    toggleCollectionFavorite,
    collection.id
  )

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
          className={`h-8 w-8 ${isFavorite ? 'text-yellow-500 hover:text-yellow-600' : ''}`}
          onClick={handleToggleFavorite}
          disabled={favoriting}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
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
