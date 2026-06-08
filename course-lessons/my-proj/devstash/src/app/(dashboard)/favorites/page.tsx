import { Star } from 'lucide-react'
import { auth } from '@/auth'
import { getFavoriteItems, getFavoriteCollections } from '@/lib/db/favorites'
import { getCollectionList } from '@/lib/db/collections'
import FavoritesView from '@/components/favorites/FavoritesView'

export const dynamic = 'force-dynamic'

export default async function FavoritesPage() {
  const session = await auth()
  const userId = session?.user?.id ?? ''

  const [items, collections, collectionList] = await Promise.all([
    getFavoriteItems(userId),
    getFavoriteCollections(userId),
    getCollectionList(userId),
  ])

  const total = items.length + collections.length

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-yellow-500/10">
          <Star className="h-5 w-5 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
          <p className="text-sm text-muted-foreground">
            {total} favorited {total === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
          <p className="font-mono text-sm text-muted-foreground">
            No favorites yet — star items or collections to see them here.
          </p>
        </div>
      ) : (
        <FavoritesView items={items} collections={collections} collectionList={collectionList} />
      )}
    </div>
  )
}
