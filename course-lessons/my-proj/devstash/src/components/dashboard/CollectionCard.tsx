'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Pencil, Trash2, Star } from 'lucide-react'
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
import { toggleCollectionFavorite } from '@/actions/collections'
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle'

interface CollectionCardProps {
  collection: CollectionWithStats
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { isFavorite, favoriting, toggle } = useFavoriteToggle(
    collection.isFavorite,
    toggleCollectionFavorite,
    collection.id
  )

  const borderStyle = collection.dominantType
    ? { borderLeftColor: collection.dominantType.color }
    : undefined

  function handleDropdownClick(e: React.MouseEvent) {
    e.stopPropagation()
  }

  function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    toggle()
  }

  return (
    <>
      <div
        className="relative flex flex-col gap-3 rounded-lg border border-border border-l-[3px] bg-card p-4 hover:bg-accent/30 transition-colors min-h-[110px]"
        style={borderStyle}
      >
        {/* Stretched link covering the card; interactive elements sit above via z-10 */}
        <Link
          href={`/collections/${collection.id}`}
          className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          aria-label={`Open ${collection.name}`}
        />
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate pr-1">{collection.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{collection.itemCount} items</p>
          </div>
          <div className="flex items-center gap-1 shrink-0" onClick={handleDropdownClick}>
            <button
              onClick={handleToggleFavorite}
              disabled={favoriting}
              className={`p-0.5 rounded transition-colors ${isFavorite ? 'text-yellow-500' : 'text-muted-foreground/40 hover:text-yellow-500'}`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
            </button>
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
                <DropdownMenuItem onClick={handleToggleFavorite} disabled={favoriting}>
                  <Star className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  {isFavorite ? 'Unfavorite' : 'Favorite'}
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
