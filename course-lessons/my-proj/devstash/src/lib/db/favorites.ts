import { prisma } from '@/lib/prisma'
import type { ItemWithType } from './items'

export interface FavoriteItem extends ItemWithType {
  updatedAt: Date
}

export interface FavoriteCollection {
  id: string
  name: string
  description: string | null
  updatedAt: Date
  itemCount: number
}

export async function getFavoriteItems(userId: string): Promise<FavoriteItem[]> {
  return prisma.item.findMany({
    where: { isFavorite: true, userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      contentType: true,
      url: true,
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
    },
  })
}

export async function getFavoriteCollections(userId: string): Promise<FavoriteCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { isFavorite: true, userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  })
  return collections.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    updatedAt: c.updatedAt,
    itemCount: c._count.items,
  }))
}
