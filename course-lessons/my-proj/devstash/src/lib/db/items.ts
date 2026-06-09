import { prisma } from '@/lib/prisma'
import { ITEMS_PER_PAGE, COLLECTIONS_PER_PAGE } from '@/lib/constants'

export interface ItemWithType {
  id: string
  title: string
  description: string | null
  isFavorite: boolean
  isPinned: boolean
  createdAt: Date
  contentType: string
  url: string | null
  fileUrl: string | null
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
  fileUrl: true,
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

export async function getItemsByCollection(userId: string, collectionId: string): Promise<ItemWithType[]> {
  return prisma.item.findMany({
    where: { userId, collections: { some: { collectionId } } },
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
  contentType: 'TEXT' | 'URL' | 'FILE'
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
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
      fileUrl: data.fileUrl ?? null,
      fileName: data.fileName ?? null,
      fileSize: data.fileSize ?? null,
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

export interface PaginatedItems {
  items: ItemWithType[]
  total: number
}

export async function getItemsByTypePaginated(
  userId: string,
  typeName: string,
  page: number,
  pageSize = ITEMS_PER_PAGE,
): Promise<PaginatedItems> {
  const skip = (page - 1) * pageSize
  const where = { userId, itemType: { name: typeName } }
  const [items, total] = await Promise.all([
    prisma.item.findMany({ where, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }], skip, take: pageSize, select: itemSelect }),
    prisma.item.count({ where }),
  ])
  return { items, total }
}

export async function getItemsByCollectionPaginated(
  userId: string,
  collectionId: string,
  page: number,
  pageSize = COLLECTIONS_PER_PAGE,
): Promise<PaginatedItems> {
  const skip = (page - 1) * pageSize
  const where = { userId, collections: { some: { collectionId } } }
  const [items, total] = await Promise.all([
    prisma.item.findMany({ where, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }], skip, take: pageSize, select: itemSelect }),
    prisma.item.count({ where }),
  ])
  return { items, total }
}

export async function deleteItem(id: string, userId: string): Promise<{ fileUrl: string | null } | null> {
  const existing = await prisma.item.findFirst({ where: { id, userId }, select: { id: true, fileUrl: true } })
  if (!existing) return null

  await prisma.item.delete({ where: { id } })
  return { fileUrl: existing.fileUrl }
}

export async function toggleItemFavorite(id: string, userId: string): Promise<boolean | null> {
  const item = await prisma.item.findFirst({ where: { id, userId }, select: { isFavorite: true } })
  if (!item) return null
  const updated = await prisma.item.update({
    where: { id },
    data: { isFavorite: !item.isFavorite },
    select: { isFavorite: true },
  })
  return updated.isFavorite
}

export async function toggleItemPin(id: string, userId: string): Promise<boolean | null> {
  const item = await prisma.item.findFirst({ where: { id, userId }, select: { isPinned: true } })
  if (!item) return null
  const updated = await prisma.item.update({
    where: { id },
    data: { isPinned: !item.isPinned },
    select: { isPinned: true },
  })
  return updated.isPinned
}

export async function getItemStats(userId: string) {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { isFavorite: true, userId } }),
  ])
  return { total, favorites }
}
