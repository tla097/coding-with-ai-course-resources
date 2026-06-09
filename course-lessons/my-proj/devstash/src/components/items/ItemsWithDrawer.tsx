'use client'

import { useState } from 'react'
import ItemCard from '@/components/dashboard/ItemCard'
import ImageThumbnailCard from '@/components/items/ImageThumbnailCard'
import ItemDrawer from '@/components/items/ItemDrawer'
import type { ItemWithType } from '@/lib/db/items'

interface Props {
  items: ItemWithType[]
  collections: { id: string; name: string }[]
  variant?: 'list' | 'grid' | 'image-gallery'
  isPro?: boolean
}

export default function ItemsWithDrawer({ items, collections, variant = 'list', isPro }: Props) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  function handleCardClick(itemId: string) {
    setSelectedItemId(itemId)
    setOpen(true)
  }

  const containerClass =
    variant === 'image-gallery'
      ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'
      : variant === 'grid'
      ? 'grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'
      : 'space-y-2'

  return (
    <>
      <div className={containerClass}>
        {items.map(item =>
          variant === 'image-gallery' ? (
            <ImageThumbnailCard key={item.id} item={item} onClick={() => handleCardClick(item.id)} />
          ) : (
            <ItemCard key={item.id} item={item} onClick={() => handleCardClick(item.id)} />
          )
        )}
      </div>
      <ItemDrawer
        itemId={selectedItemId}
        open={open}
        onOpenChange={setOpen}
        collections={collections}
        isPro={isPro}
      />
    </>
  )
}
