import { prisma } from '@/lib/prisma'

export interface ProfileItemTypeStat {
  typeName: string
  color: string
  count: number
}

export interface ProfileData {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: Date
  hasPassword: boolean
  totalItems: number
  totalCollections: number
  itemsByType: ProfileItemTypeStat[]
}

export async function getProfileData(userId: string): Promise<ProfileData> {
  const [user, totalCollections, itemTypes] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        password: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({
      where: { isSystem: true },
      select: {
        name: true,
        color: true,
        _count: { select: { items: { where: { userId } } } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    hasPassword: !!user.password,
    totalItems: user._count.items,
    totalCollections,
    itemsByType: itemTypes.map(t => ({
      typeName: t.name,
      color: t.color,
      count: t._count.items,
    })),
  }
}
