'use client'

import { useState } from 'react'
import ItemCard from '@/components/dashboard/ItemCard'
import ItemDrawer from '@/components/items/ItemDrawer'
import type { ItemWithType } from '@/lib/db/items'

interface Props {
  items: ItemWithType[]
  variant?: 'list' | 'grid'
}

export default function ItemsWithDrawer({ items, variant = 'list' }: Props) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  function handleCardClick(itemId: string) {
    setSelectedItemId(itemId)
    setOpen(true)
  }

  const containerClass =
    variant === 'grid'
      ? 'grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'
      : 'space-y-2'

  return (
    <>
      <div className={containerClass}>
        {items.map(item => (
          <ItemCard key={item.id} item={item} onClick={() => handleCardClick(item.id)} />
        ))}
      </div>
      <ItemDrawer
        itemId={selectedItemId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
