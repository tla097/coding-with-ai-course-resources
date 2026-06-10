'use server'

import { z } from 'zod'
import { requireAuth } from '@/lib/actions/require-auth'
import { parseActionInput } from '@/lib/actions/parse-action-input'
import { checkCollectionLimit } from '@/lib/usage-limits'
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
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const parseResult = parseActionInput(createCollectionSchema, data)
  if (!parseResult.ok) return { success: false as const, error: parseResult.fieldErrors }

  const limitCheck = await checkCollectionLimit(authResult.userId, authResult.isPro)
  if (!limitCheck.allowed) {
    return { success: false as const, error: limitCheck.error, limitReached: limitCheck.limitReached }
  }

  try {
    const created = await dbCreateCollection(authResult.userId, parseResult.data)
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
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const parseResult = parseActionInput(updateCollectionSchema, data)
  if (!parseResult.ok) return { success: false as const, error: parseResult.fieldErrors }

  try {
    const updated = await dbUpdateCollection(id, authResult.userId, parseResult.data)
    return { success: true as const, data: updated }
  } catch {
    return { success: false as const, error: 'Failed to update collection.' }
  }
}

export async function deleteCollection(id: string) {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  try {
    await dbDeleteCollection(id, authResult.userId)
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Failed to delete collection.' }
  }
}

export async function toggleCollectionFavorite(id: string) {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  try {
    const isFavorite = await dbToggleCollectionFavorite(id, authResult.userId)
    if (isFavorite === null) return { success: false as const, error: 'Collection not found.' }
    return { success: true as const, data: { isFavorite } }
  } catch {
    return { success: false as const, error: 'Failed to update favorite.' }
  }
}
