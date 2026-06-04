'use client'

import { useEffect, useState } from 'react'
import { Star, Pin, Copy, Pencil, Trash2, FolderOpen, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ICON_MAP } from '@/lib/icon-map'
import type { ItemDetail } from '@/lib/db/items'

interface ItemDetailResponse extends Omit<ItemDetail, 'createdAt' | 'updatedAt'> {
  createdAt: string
  updatedAt: string
}

interface Props {
  itemId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ItemDrawer({ itemId, open, onOpenChange }: Props) {
  const [item, setItem] = useState<ItemDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  useEffect(() => {
    if (!itemId || !open) return

    setLoading(true)
    setItem(null)

    fetch(`/api/items/${itemId}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch')
        return r.json()
      })
      .then((data: ItemDetailResponse) => {
        setItem(data)
        setIsFavorite(data.isFavorite)
        setIsPinned(data.isPinned)
      })
      .catch(() => toast.error('Failed to load item'))
      .finally(() => setLoading(false))
  }, [itemId, open])

  function handleCopy() {
    if (!item) return
    const text = item.content ?? item.url ?? item.title
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard')
    })
  }

  const Icon = item ? (ICON_MAP[item.itemType.icon] ?? null) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 sm:max-w-lg"
      >
        {loading && <DrawerSkeleton />}

        {!loading && item && (
          <>
            <SheetHeader className="px-5 pt-5 pb-4 border-b border-border gap-2">
              <div className="flex items-center gap-2 pr-8">
                {Icon && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${item.itemType.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: item.itemType.color }} />
                  </div>
                )}
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: `${item.itemType.color}20`, color: item.itemType.color }}
                >
                  {item.itemType.name}
                </span>
                {item.language && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {item.language}
                  </span>
                )}
              </div>
              <SheetTitle className="text-lg pr-8 leading-snug">{item.title}</SheetTitle>
            </SheetHeader>

            {/* Action bar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFavorite(f => !f)}
                className={isFavorite ? 'text-yellow-500 hover:text-yellow-600' : ''}
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
                Favorite
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPinned(p => !p)}
              >
                <Pin className={`h-4 w-4 ${isPinned ? 'fill-foreground' : ''}`} />
                Pin
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <div className="ml-auto flex items-center gap-0.5">
                <Button variant="ghost" size="icon-sm">
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>

            {/* Detail sections */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {item.description && (
                <section>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Description
                  </h3>
                  <p className="text-sm">{item.description}</p>
                </section>
              )}

              {item.content && (
                <section>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Content
                  </h3>
                  <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words font-mono leading-relaxed">
                    {item.content}
                  </pre>
                </section>
              )}

              {item.url && (
                <section>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    URL
                  </h3>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {item.url}
                  </a>
                </section>
              )}

              {item.tags.length > 0 && (
                <section>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {item.collections.length > 0 && (
                <section>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Collections
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {item.collections.map(({ collection }) => (
                      <span
                        key={collection.id}
                        className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        <FolderOpen className="h-3 w-3" />
                        {collection.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Details
                </h3>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Created{' '}
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Updated{' '}
                      {new Date(item.updatedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DrawerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="px-5 pt-5 pb-4 border-b border-border space-y-3">
        <div className="flex gap-2 pr-8">
          <div className="h-5 w-16 bg-muted rounded-full" />
          <div className="h-5 w-20 bg-muted rounded-full" />
        </div>
        <div className="h-6 w-3/4 bg-muted rounded" />
      </div>
      <div className="flex gap-2 px-4 py-3 border-b border-border">
        <div className="h-7 w-20 bg-muted rounded" />
        <div className="h-7 w-12 bg-muted rounded" />
        <div className="h-7 w-14 bg-muted rounded" />
      </div>
      <div className="px-5 py-5 space-y-5">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-4/5 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="h-28 w-full bg-muted rounded-md" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-10 bg-muted rounded" />
          <div className="flex gap-1.5">
            <div className="h-5 w-14 bg-muted rounded-full" />
            <div className="h-5 w-10 bg-muted rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
