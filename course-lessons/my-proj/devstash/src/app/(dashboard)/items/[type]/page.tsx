import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { getItemsByTypePaginated } from '@/lib/db/items'
import { getCollectionList } from '@/lib/db/collections'
import { ICON_MAP } from '@/lib/icon-map'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import { prisma } from '@/lib/prisma'
import ItemsWithDrawer from '@/components/items/ItemsWithDrawer'
import Pagination from '@/components/ui/Pagination'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params
  const label = type.charAt(0).toUpperCase() + type.slice(1)
  return { title: `${label} | DevStash` }
}

interface Props {
  params: Promise<{ type: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function ItemsTypePage({ params, searchParams }: Props) {
  const [{ type }, { page: pageParam }] = await Promise.all([params, searchParams])
  const typeName = type.endsWith('s') ? type.slice(0, -1) : type
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const itemType = await prisma.itemType.findFirst({
    where: { name: typeName },
  })

  if (!itemType) notFound()

  const session = await auth()
  const userId = session?.user?.id ?? ''

  const [{ items, total }, collectionList] = await Promise.all([
    getItemsByTypePaginated(userId, typeName, page, ITEMS_PER_PAGE),
    getCollectionList(userId),
  ])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const Icon = ICON_MAP[itemType.icon] ?? null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{ backgroundColor: `${itemType.color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color: itemType.color }} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize">{type}</h1>
          <p className="text-sm text-muted-foreground">{total} item{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No {type} yet.</p>
          <p className="text-xs text-muted-foreground/70">Use the <span className="font-medium text-muted-foreground">New Item</span> button to add your first one.</p>
        </div>
      ) : (
        <>
          <ItemsWithDrawer items={items} collections={collectionList} variant="grid" />
          <Pagination page={page} totalPages={totalPages} basePath={`/items/${type}`} />
        </>
      )}
    </div>
  )
}
