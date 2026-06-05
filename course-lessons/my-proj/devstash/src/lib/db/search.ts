import { prisma } from '@/lib/prisma'

export interface SearchItem {
  id: string
  title: string
  contentPreview: string | null
  itemType: { name: string; icon: string; color: string }
}

export interface SearchCollection {
  id: string
  name: string
  itemCount: number
}

export interface SearchData {
  items: SearchItem[]
  collections: SearchCollection[]
}

export async function getSearchData(userId: string): Promise<SearchData> {
  const [items, collections] = await Promise.all([
    prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        url: true,
        itemType: { select: { name: true, icon: true, color: true } },
      },
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
      },
    }),
  ])

  return {
    items: items.map(item => ({
      id: item.id,
      title: item.title,
      contentPreview: item.content ? item.content.slice(0, 100) : item.url,
      itemType: item.itemType,
    })),
    collections: collections.map(col => ({
      id: col.id,
      name: col.name,
      itemCount: col._count.items,
    })),
  }
}
