import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { getItemsByType } from '@/lib/db/items'
import { ICON_MAP } from '@/lib/icon-map'
import { prisma } from '@/lib/prisma'
import ItemCard from '@/components/dashboard/ItemCard'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ type: string }>
}

export default async function ItemsTypePage({ params }: Props) {
  const { type } = await params
  const typeName = type.endsWith('s') ? type.slice(0, -1) : type

  const itemType = await prisma.itemType.findFirst({
    where: { name: typeName },
  })

  if (!itemType) notFound()

  const session = await auth()
  const userId = session?.user?.id ?? ''

  const items = await getItemsByType(userId, typeName)

  const Icon = ICON_MAP[itemType.icon] ?? null

  return (
    <div className="space-y-6 max-w-5xl">
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
          <p className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No {type} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
