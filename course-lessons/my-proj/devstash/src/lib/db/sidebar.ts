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
}

export async function getSidebarData(userId: string): Promise<SidebarData> {
  const [itemTypes, collections] = await Promise.all([
    prisma.itemType.findMany({
      where: { isSystem: true },
      include: { _count: { select: { items: { where: { userId } } } } },
      orderBy: { name: 'asc' },
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        items: {
          include: {
            item: {
              select: { itemType: { select: { color: true } } },
            },
          },
        },
      },
    }),
  ])

  const processedCollections = collections.map(col => {
    const colorCounts = new Map<string, number>()
    for (const ic of col.items) {
      const { color } = ic.item.itemType
      colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1)
    }
    let dominantColor: string | null = null
    let maxCount = 0
    for (const [color, count] of colorCounts) {
      if (count > maxCount) {
        maxCount = count
        dominantColor = color
      }
    }
    return { id: col.id, name: col.name, isFavorite: col.isFavorite, dominantColor }
  })

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
  }
}