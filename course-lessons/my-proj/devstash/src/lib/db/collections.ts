import { prisma } from '@/lib/prisma'

export interface CollectionListItem {
  id: string
  name: string
}

export async function getCollectionList(userId: string): Promise<CollectionListItem[]> {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

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

type CollectionWithItems = {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  createdAt: Date
  _count: { items: number }
  items: Array<{
    item: { itemType: { id: string; name: string; icon: string; color: string } }
  }>
}

function mapCollectionStats(col: CollectionWithItems): CollectionWithStats {
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
    itemCount: col._count.items,
    dominantType,
    types,
  }
}

const collectionInclude = {
  _count: { select: { items: true } },
  items: {
    select: {
      item: {
        select: {
          itemType: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      },
    },
  },
} as const

export async function getRecentCollections(userId: string, limit = 20): Promise<CollectionWithStats[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: collectionInclude,
  })
  return collections.map(mapCollectionStats)
}

export async function getCollectionCount(userId: string): Promise<number> {
  return prisma.collection.count({ where: { userId } })
}

export async function getFavoriteCollectionCount(userId: string): Promise<number> {
  return prisma.collection.count({ where: { userId, isFavorite: true } })
}

export async function getAllCollections(userId: string): Promise<CollectionWithStats[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    include: collectionInclude,
  })
  return collections.map(mapCollectionStats)
}

export async function getCollectionById(id: string, userId: string): Promise<CollectionWithStats | null> {
  const col = await prisma.collection.findFirst({
    where: { id, userId },
    include: collectionInclude,
  })
  if (!col) return null
  return mapCollectionStats(col)
}

export async function updateCollection(
  id: string,
  userId: string,
  data: { name: string; description?: string | null },
) {
  return prisma.collection.update({
    where: { id, userId },
    data: {
      name: data.name,
      description: data.description ?? null,
    },
  })
}

export async function deleteCollection(id: string, userId: string) {
  return prisma.collection.delete({
    where: { id, userId },
  })
}

export async function toggleCollectionFavorite(id: string, userId: string): Promise<boolean | null> {
  const collection = await prisma.collection.findFirst({ where: { id, userId }, select: { isFavorite: true } })
  if (!collection) return null
  const updated = await prisma.collection.update({
    where: { id },
    data: { isFavorite: !collection.isFavorite },
    select: { isFavorite: true },
  })
  return updated.isFavorite
}
