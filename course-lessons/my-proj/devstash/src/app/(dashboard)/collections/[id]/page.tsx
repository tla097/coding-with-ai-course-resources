import { notFound } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import ItemsWithDrawer from '@/components/items/ItemsWithDrawer'
import CollectionActions from '@/components/collections/CollectionActions'
import Pagination from '@/components/ui/Pagination'
import { getCollectionById, getCollectionList } from '@/lib/db/collections'
import { getItemsByCollectionPaginated } from '@/lib/db/items'
import { COLLECTIONS_PER_PAGE } from '@/lib/constants'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [{ id }, { page: pageParam }] = await Promise.all([params, searchParams])
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const session = await auth()
  const userId = session?.user?.id ?? ''

  const [collection, { items, total }, collectionList] = await Promise.all([
    getCollectionById(id, userId),
    getItemsByCollectionPaginated(userId, id, page, COLLECTIONS_PER_PAGE),
    getCollectionList(userId),
  ])

  if (!collection) notFound()

  const totalPages = Math.ceil(total / COLLECTIONS_PER_PAGE)
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
              {collection.description ?? `${total} item${total !== 1 ? 's' : ''}`}
            </p>
            {collection.description && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {total} item{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <CollectionActions collection={{ id: collection.id, name: collection.name, description: collection.description, isFavorite: collection.isFavorite }} />
      </div>

      {total === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No items in this collection yet.</p>
        </div>
      ) : (
        <>
          <ItemsWithDrawer items={items} collections={collectionList} variant="grid" isPro={session?.user?.isPro ?? false} />
          <Pagination page={page} totalPages={totalPages} basePath={`/collections/${id}`} />
        </>
      )}
    </div>
  )
}
