import { prisma } from '@/lib/prisma'
import { FREE_TIER_ITEM_LIMIT, FREE_TIER_COLLECTION_LIMIT } from '@/lib/constants'

export type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; error: string; limitReached: 'items' | 'collections' }

export async function checkItemLimit(userId: string, isPro: boolean): Promise<LimitCheckResult> {
  if (isPro) return { allowed: true }

  const count = await prisma.item.count({ where: { userId } })
  if (count >= FREE_TIER_ITEM_LIMIT) {
    return {
      allowed: false,
      error: `Free plan limit reached (${FREE_TIER_ITEM_LIMIT} items). Upgrade to Pro for unlimited items.`,
      limitReached: 'items',
    }
  }
  return { allowed: true }
}

export async function checkCollectionLimit(userId: string, isPro: boolean): Promise<LimitCheckResult> {
  if (isPro) return { allowed: true }

  const count = await prisma.collection.count({ where: { userId } })
  if (count >= FREE_TIER_COLLECTION_LIMIT) {
    return {
      allowed: false,
      error: `Free plan limit reached (${FREE_TIER_COLLECTION_LIMIT} collections). Upgrade to Pro for unlimited collections.`,
      limitReached: 'collections',
    }
  }
  return { allowed: true }
}
