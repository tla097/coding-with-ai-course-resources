'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Heart, Star } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CollectionWithStats } from '@/lib/db/collections'
import { ICON_MAP } from '@/lib/icon-map'
import EditCollectionDialog from '@/components/collections/EditCollectionDialog'
import DeleteCollectionDialog from '@/components/collections/DeleteCollectionDialog'

interface CollectionCardProps {
  collection: CollectionWithStats
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const borderStyle = collection.dominantType
    ? { borderLeftColor: collection.dominantType.color }
    : undefined

  function handleCardClick() {
    router.push(`/collections/${collection.id}`)
  }

  function handleDropdownClick(e: React.MouseEvent) {
    e.stopPropagation()
  }

  return (
    <>
      <div
        role="link"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={e => e.key === 'Enter' && handleCardClick()}
        className="relative flex flex-col gap-3 rounded-lg border border-border border-l-[3px] bg-card p-4 hover:bg-accent/30 transition-colors min-h-[110px] cursor-pointer"
        style={borderStyle}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate pr-1">{collection.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{collection.itemCount} items</p>
          </div>
          <div className="flex items-center gap-1 shrink-0" onClick={handleDropdownClick}>
            {collection.isFavorite && (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Heart className="h-4 w-4 mr-2" />
                  Favorite
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {collection.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{collection.description}</p>
        )}
        {collection.types.length > 0 && (
          <div className="mt-auto flex items-center gap-1.5">
            {collection.types.map(type => {
              const Icon = ICON_MAP[type.icon]
              if (!Icon) return null
              return <Icon key={type.id} className="h-3.5 w-3.5" style={{ color: type.color }} />
            })}
          </div>
        )}
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
      />
    </>
  )
}
