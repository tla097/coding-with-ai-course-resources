import { FolderOpen } from 'lucide-react'
import CollectionCard from '@/components/dashboard/CollectionCard'
import { getAllCollections } from '@/lib/db/collections'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const session = await auth()
  const userId = session?.user?.id ?? ''
  const collections = await getAllCollections(userId)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-md"
          style={{ backgroundColor: '#8b5cf620' }}
        >
          <FolderOpen className="h-5 w-5" style={{ color: '#8b5cf6' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-sm text-muted-foreground">
            {collections.length} collection{collections.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No collections yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map(col => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      )}
    </div>
  )
}
