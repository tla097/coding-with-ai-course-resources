import { prisma } from '@/lib/prisma'

export async function createCollection(
  userId: string,
  data: { name: string; description?: string | null },
) {
  return prisma.collection.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      userId,
    },
  })
}


export interface CollectionWithStats {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  createdAt: Date
  itemCount: number
  dominantType: { icon: string; color: string } | null
  types: Array<{ id: string; name: string; icon: string; color: string }>
}

export async function getRecentCollections(userId: string): Promise<CollectionWithStats[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      items: {
        include: {
          item: {
            select: {
              itemType: {
                select: { id: true, name: true, icon: true, color: true },
              },
            },
          },
        },
      },
    },
  })

  return collections.map(col => {
    const typeCounts = new Map<string, { count: number; name: string; icon: string; color: string }>()

    for (const ic of col.items) {
      const type = ic.item.itemType
      const existing = typeCounts.get(type.id)
      if (existing) {
        existing.count++
      } else {
        typeCounts.set(type.id, { count: 1, name: type.name, icon: type.icon, color: type.color })
      }
    }

    let dominantType: { icon: string; color: string } | null = null
    let maxCount = 0
    for (const val of typeCounts.values()) {
      if (val.count > maxCount) {
        maxCount = val.count
        dominantType = { icon: val.icon, color: val.color }
      }
    }

    const types = Array.from(typeCounts.entries()).map(([id, val]) => ({
      id,
      name: val.name,
      icon: val.icon,
      color: val.color,
    }))

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      createdAt: col.createdAt,
      itemCount: col.items.length,
      dominantType,
      types,
    }
  })
}
