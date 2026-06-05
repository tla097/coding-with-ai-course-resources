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

export interface ItemDetail {
  id: string
  title: string
  description: string | null
  language: string | null
  contentType: string
  content: string | null
  url: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  isFavorite: boolean
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
  itemType: { id: string; name: string; icon: string; color: string }
  tags: Array<{ id: string; name: string }>
  collections: Array<{ collection: { id: string; name: string } }>
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

export async function getItemById(id: string, userId: string): Promise<ItemDetail | null> {
  return prisma.item.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      description: true,
      language: true,
      contentType: true,
      content: true,
      url: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  })
}

export interface UpdateItemData {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
  collectionIds: string[]
}

export async function updateItem(
  id: string,
  userId: string,
  data: UpdateItemData,
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return null

  return prisma.item.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        set: [],
        connectOrCreate: data.tags.map(name => ({
          where: { name },
          create: { name },
        })),
      },
      collections: {
        deleteMany: {},
        createMany: {
          data: data.collectionIds.map(collectionId => ({ collectionId })),
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      language: true,
      contentType: true,
      content: true,
      url: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  })
}

export interface CreateItemData {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
  collectionIds: string[]
  itemTypeId: string
  contentType: 'TEXT' | 'URL'
}

export async function createItem(userId: string, data: CreateItemData): Promise<ItemDetail> {
  return prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      contentType: data.contentType,
      userId,
      itemTypeId: data.itemTypeId,
      tags: {
        connectOrCreate: data.tags.map(name => ({
          where: { name },
          create: { name },
        })),
      },
      collections: {
        createMany: {
          data: data.collectionIds.map(collectionId => ({ collectionId })),
          skipDuplicates: true,
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      language: true,
      contentType: true,
      content: true,
      url: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
      itemType: { select: { id: true, name: true, icon: true, color: true } },
      tags: { select: { id: true, name: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  })
}

export async function deleteItem(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.item.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return false

  await prisma.item.delete({ where: { id } })
  return true
}

export async function getItemStats(userId: string) {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { isFavorite: true, userId } }),
  ])
  return { total, favorites }
}
