'use client'

import { useEffect } from 'react'
import { Star, Pin, Copy, Check } from 'lucide-react'
import type { ItemWithType } from '@/lib/db/items'
import { ICON_MAP } from '@/lib/icon-map'
import { toggleItemFavorite } from '@/actions/items'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useKeyboardClick } from '@/hooks/useKeyboardClick'
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle'

interface ItemCardProps {
  item: ItemWithType
  onClick?: () => void
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const { isFavorite, setIsFavorite, favoriting, toggle } = useFavoriteToggle(
    item.isFavorite,
    toggleItemFavorite,
    item.id
  )
  const Icon = ICON_MAP[item.itemType.icon] ?? null
  const { copied, copy } = useCopyToClipboard({ resetMs: 1000, message: 'Copied!' })
  const handleKeyDown = useKeyboardClick(onClick)

  useEffect(() => {
    setIsFavorite(item.isFavorite)
  }, [item.isFavorite, setIsFavorite])

  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const text = item.contentType === 'URL' ? (item.url ?? item.title) : (item.content ?? item.title)
    copy(text)
  }

  function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    toggle()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="group flex gap-4 rounded-lg border border-border border-l-[3px] bg-card p-4 hover:bg-accent/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ borderLeftColor: item.itemType.color }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {Icon && (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${item.itemType.color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: item.itemType.color }} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-sm truncate">{item.title}</span>
            {item.isPinned && (
              <Pin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopy}
              aria-label="Copy to clipboard"
              className="flex h-8 w-8 items-center justify-center rounded transition-colors text-muted-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={favoriting}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`flex h-8 w-8 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isFavorite ? 'text-yellow-500' : 'text-muted-foreground/40 hover:text-yellow-500 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
            >
              <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-yellow-500' : ''}`} />
            </button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formattedDate}
            </span>
          </div>
        </div>
        {item.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.description}</p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map(tag => (
              <span
                key={tag.id}
                className="rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
