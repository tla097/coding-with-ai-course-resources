import { prisma } from '@/lib/prisma'

export interface ItemWithType {
  id: string
  title: string
  description: string | null
  isFavorite: boolean
  isPinned: boolean
  createdAt: Date
  contentType: string
  url: string | null
  itemType: { id: string; name: string; icon: string; color: string }
  tags: Array<{ id: string; name: string }>
}

const itemSelect = {
  id: true,
  title: true,
  description: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  contentType: true,
  url: true,
  itemType: {
    select: { id: true, name: true, icon: true, color: true },
  },
  tags: {
    select: { id: true, name: true },
  },
} as const

export async function getPinnedItems(userId: string): Promise<ItemWithType[]> {
  return prisma.item.findMany({
    where: { isPinned: true, userId },
    orderBy: { createdAt: 'desc' },
    select: itemSelect,
  })
}

export async function getRecentItems(userId: string, limit = 10): Promise<ItemWithType[]> {
  return prisma.item.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: itemSelect,
  })
}

export async function getItemsByType(userId: string, typeName: string): Promise<ItemWithType[]> {
  return prisma.item.findMany({
    where: { userId, itemType: { name: typeName } },
    orderBy: { createdAt: 'desc' },
    select: itemSelect,
  })
}

export async function getItemStats(userId: string) {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { isFavorite: true, userId } }),
  ])
  return { total, favorites }
}
