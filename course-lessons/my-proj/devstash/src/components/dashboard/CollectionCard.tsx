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
import type { MockCollection } from '@/lib/mock-data'
import { mockItemTypes } from '@/lib/mock-data'

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
  collection: MockCollection
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const defaultType = collection.defaultTypeId
    ? mockItemTypes.find(t => t.id === collection.defaultTypeId)
    : null
  const Icon = defaultType ? ICON_MAP[defaultType.icon] : null

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 hover:bg-accent/30 transition-colors min-h-[110px]"
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
      {Icon && defaultType && (
        <div className="mt-auto">
          <Icon className="h-4 w-4" style={{ color: defaultType.color }} />
        </div>
      )}
    </Link>
  )
}
