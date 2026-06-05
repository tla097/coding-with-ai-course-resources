import { notFound } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import ItemsWithDrawer from '@/components/items/ItemsWithDrawer'
import CollectionActions from '@/components/collections/CollectionActions'
import { getCollectionById, getCollectionList } from '@/lib/db/collections'
import { getItemsByCollection } from '@/lib/db/items'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CollectionPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id ?? ''

  const [collection, items, collectionList] = await Promise.all([
    getCollectionById(id, userId),
    getItemsByCollection(userId, id),
    getCollectionList(userId),
  ])

  if (!collection) notFound()

  const accentColor = collection.dominantType?.color ?? '#8b5cf6'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <FolderOpen className="h-5 w-5" style={{ color: accentColor }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{collection.name}</h1>
            <p className="text-sm text-muted-foreground">
              {collection.description ?? `${items.length} item${items.length !== 1 ? 's' : ''}`}
            </p>
            {collection.description && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <CollectionActions collection={collection} />
      </div>

      {items.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No items in this collection yet.</p>
        </div>
      ) : (
        <ItemsWithDrawer items={items} collections={collectionList} variant="grid" />
      )}
    </div>
  )
}
