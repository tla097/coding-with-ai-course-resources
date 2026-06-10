import { prisma } from '@/lib/prisma'

export interface SidebarItemType {
  id: string
  name: string
  icon: string
  color: string
  count: number
}

export interface SidebarCollection {
  id: string
  name: string
  dominantColor: string | null
}

export interface SidebarData {
  itemTypes: SidebarItemType[]
  favoriteCollections: SidebarCollection[]
  recentCollections: SidebarCollection[]
  allCollections: { id: string; name: string }[]
}

export async function getSidebarData(userId: string): Promise<SidebarData> {
  const [itemTypes, collections, allCollections] = await Promise.all([
    prisma.itemType.findMany({
      where: { isSystem: true },
      include: { _count: { select: { items: { where: { userId } } } } },
      orderBy: { name: 'asc' },
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, name: true, isFavorite: true },
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  const collectionIds = collections.map(c => c.id)
  const colorRows = collectionIds.length > 0
    ? await prisma.itemCollection.findMany({
        where: { collectionId: { in: collectionIds } },
        select: {
          collectionId: true,
          item: { select: { itemType: { select: { color: true } } } },
        },
      })
    : []

  const colorCounts = new Map<string, Map<string, number>>()
  for (const row of colorRows) {
    const { collectionId } = row
    const { color } = row.item.itemType
    if (!colorCounts.has(collectionId)) colorCounts.set(collectionId, new Map())
    const counts = colorCounts.get(collectionId)!
    counts.set(color, (counts.get(color) ?? 0) + 1)
  }

  const dominantColors = new Map<string, string | null>()
  for (const id of collectionIds) {
    const counts = colorCounts.get(id)
    if (!counts) { dominantColors.set(id, null); continue }
    let maxCount = 0
    let dominant: string | null = null
    for (const [color, count] of counts) {
      if (count > maxCount) { maxCount = count; dominant = color }
    }
    dominantColors.set(id, dominant)
  }

  const processedCollections = collections.map(col => ({
    id: col.id,
    name: col.name,
    isFavorite: col.isFavorite,
    dominantColor: dominantColors.get(col.id) ?? null,
  }))

  return {
    itemTypes: itemTypes.map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      color: t.color,
      count: t._count.items,
    })),
    favoriteCollections: processedCollections.filter(c => c.isFavorite),
    recentCollections: processedCollections.filter(c => !c.isFavorite),
    allCollections,
  }
}
