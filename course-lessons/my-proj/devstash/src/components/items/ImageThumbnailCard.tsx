'use client'

import type { ItemWithType } from '@/lib/db/items'
import { useKeyboardClick } from '@/hooks/useKeyboardClick'

interface Props {
  item: ItemWithType
  onClick?: () => void
}

export default function ImageThumbnailCard({ item, onClick }: Props) {
  const handleKeyDown = useKeyboardClick(onClick)
  return (
    <div
      role="button"
      tabIndex={0}
      className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="aspect-video overflow-hidden bg-muted">
        {item.fileUrl ? (
          <img
            src={`/api/download?path=${encodeURIComponent(item.fileUrl)}&preview=true`}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-sm font-medium">{item.title}</p>
      </div>
    </div>
  )
}
