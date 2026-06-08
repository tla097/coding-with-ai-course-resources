'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import {
  createCollection as dbCreateCollection,
  updateCollection as dbUpdateCollection,
  deleteCollection as dbDeleteCollection,
  toggleCollectionFavorite as dbToggleCollectionFavorite,
} from '@/lib/db/collections'

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().nullable().transform(v => v || null),
})

export type CreateCollectionInput = z.input<typeof createCollectionSchema>

export async function createCollection(data: CreateCollectionInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }

  const parsed = createCollectionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: z.flattenError(parsed.error).fieldErrors }
  }

  try {
    const created = await dbCreateCollection(session.user.id, parsed.data)
    return { success: true as const, data: created }
  } catch {
    return { success: false as const, error: 'Failed to create collection.' }
  }
}

const updateCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().nullable().transform(v => v || null),
})

export type UpdateCollectionInput = z.input<typeof updateCollectionSchema>

export async function updateCollection(id: string, data: UpdateCollectionInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }

  const parsed = updateCollectionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: z.flattenError(parsed.error).fieldErrors }
  }

  try {
    const updated = await dbUpdateCollection(id, session.user.id, parsed.data)
    return { success: true as const, data: updated }
  } catch {
    return { success: false as const, error: 'Failed to update collection.' }
  }
}

export async function deleteCollection(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }

  try {
    await dbDeleteCollection(id, session.user.id)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Failed to delete collection.' }
  }
}

export async function toggleCollectionFavorite(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }

  try {
    const isFavorite = await dbToggleCollectionFavorite(id, session.user.id)
    if (isFavorite === null) return { success: false as const, error: 'Collection not found.' }
    return { success: true as const, data: { isFavorite } }
  } catch {
    return { success: false as const, error: 'Failed to update favorite.' }
  }
}
