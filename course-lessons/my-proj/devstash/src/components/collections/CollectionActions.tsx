'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import EditCollectionDialog from '@/components/collections/EditCollectionDialog'
import DeleteCollectionDialog from '@/components/collections/DeleteCollectionDialog'
import { toggleCollectionFavorite } from '@/actions/collections'

interface CollectionActionsProps {
  collection: { id: string; name: string; description: string | null; isFavorite: boolean }
}

export default function CollectionActions({ collection }: CollectionActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite)
  const [favoriting, setFavoriting] = useState(false)

  async function handleToggleFavorite() {
    if (favoriting) return
    setFavoriting(true)
    try {
      const result = await toggleCollectionFavorite(collection.id)
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : 'Failed to update favorite.')
        return
      }
      setIsFavorite(result.data.isFavorite)
      router.refresh()
    } finally {
      setFavoriting(false)
    }
  }

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
