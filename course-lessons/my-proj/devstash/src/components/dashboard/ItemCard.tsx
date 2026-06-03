import { Star, Pin } from 'lucide-react'
import type { ItemWithType } from '@/lib/db/items'
import { ICON_MAP } from '@/lib/icon-map'

interface ItemCardProps {
  item: ItemWithType
}

export default function ItemCard({ item }: ItemCardProps) {
  const Icon = ICON_MAP[item.itemType.icon] ?? null

  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4 hover:bg-accent/20 transition-colors cursor-pointer">
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
            {item.isFavorite && (
              <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
            )}
            {item.isPinned && (
              <Pin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
            {formattedDate}
          </span>
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
