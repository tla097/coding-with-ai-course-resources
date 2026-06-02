import Link from 'next/link'
import {
  Star,
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  type LucideIcon,
} from 'lucide-react'
import type { CollectionWithStats } from '@/lib/db/collections'

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image: ImageIcon,
  Link: LinkIcon,
}

interface CollectionCardProps {
  collection: CollectionWithStats
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const borderStyle = collection.dominantType
    ? { borderLeftColor: collection.dominantType.color }
    : undefined

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="flex flex-col gap-3 rounded-lg border border-border border-l-[3px] bg-card p-4 hover:bg-accent/30 transition-colors min-h-[110px]"
      style={borderStyle}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{collection.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{collection.itemCount} items</p>
        </div>
        {collection.isFavorite && (
          <Star className="h-4 w-4 shrink-0 fill-yellow-500 text-yellow-500" />
        )}
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
    </Link>
  )
}
