'use server'

import { z } from 'zod'
import { requireAuth } from '@/lib/actions/require-auth'
import { parseActionInput } from '@/lib/actions/parse-action-input'
import { checkItemLimit } from '@/lib/usage-limits'
import {
  createItem as dbCreateItem,
  updateItem as dbUpdateItem,
  deleteItem as dbDeleteItem,
  toggleItemFavorite as dbToggleItemFavorite,
  toggleItemPin as dbToggleItemPin,
} from '@/lib/db/items'
import { createSupabaseServer, SUPABASE_BUCKET } from '@/lib/supabase/server'

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional().nullable().transform(v => v ?? null),
  content: z.string().optional().nullable().transform(v => v ?? null),
  url: z.url('Invalid URL').optional().nullable().transform(v => v ?? null),
  language: z.string().trim().optional().nullable().transform(v => v ?? null),
  tags: z.array(z.string().trim().min(1)).default([]),
  collectionIds: z.array(z.string()).default([]),
})

const ITEM_TYPE_NAMES = ['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image'] as const

const createItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional().nullable().transform(v => v ?? null),
  content: z.string().optional().nullable().transform(v => v ?? null),
  url: z.string().optional().nullable().transform(v => v ?? null),
  language: z.string().trim().optional().nullable().transform(v => v ?? null),
  tags: z.array(z.string().trim().min(1)).default([]),
  collectionIds: z.array(z.string()).default([]),
  itemTypeId: z.string().min(1, 'Item type is required'),
  itemTypeName: z.enum(ITEM_TYPE_NAMES),
  fileUrl: z.string().optional().nullable().transform(v => v ?? null),
  fileName: z.string().optional().nullable().transform(v => v ?? null),
  fileSize: z.number().optional().nullable().transform(v => v ?? null),
}).superRefine((data, ctx) => {
  if (data.itemTypeName === 'link') {
    if (!data.url) {
      ctx.addIssue({ code: 'custom', message: 'URL is required', path: ['url'] })
    } else {
      const urlCheck = z.url().safeParse(data.url)
      if (!urlCheck.success) {
        ctx.addIssue({ code: 'custom', message: 'Invalid URL', path: ['url'] })
      }
    }
  }
  if (data.itemTypeName === 'file' || data.itemTypeName === 'image') {
    if (!data.fileUrl) {
      ctx.addIssue({ code: 'custom', message: 'File upload is required', path: ['fileUrl'] })
    }
  }
})

export type CreateItemInput = z.input<typeof createItemSchema>

export async function createItem(data: CreateItemInput) {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const parseResult = parseActionInput(createItemSchema, data)
  if (!parseResult.ok) return { success: false as const, error: parseResult.fieldErrors }

  const limitCheck = await checkItemLimit(authResult.userId, authResult.isPro)
  if (!limitCheck.allowed) {
    return { success: false as const, error: limitCheck.error, limitReached: limitCheck.limitReached }
  }

  const { title, description, content, url, language, tags, collectionIds, itemTypeId, itemTypeName, fileUrl, fileName, fileSize } = parseResult.data
  const contentType: 'TEXT' | 'URL' | 'FILE' =
    itemTypeName === 'link' ? 'URL' :
    (itemTypeName === 'file' || itemTypeName === 'image') ? 'FILE' : 'TEXT'

  try {
    const created = await dbCreateItem(authResult.userId, {
      title, description, content, url, language, tags, collectionIds, itemTypeId, contentType,
      fileUrl, fileName, fileSize,
    })
    return { success: true as const, data: created }
  } catch {
    return { success: false as const, error: 'Failed to create item.' }
  }
}

export type UpdateItemInput = z.input<typeof updateItemSchema>

export async function updateItem(itemId: string, data: UpdateItemInput) {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const parseResult = parseActionInput(updateItemSchema, data)
  if (!parseResult.ok) return { success: false as const, error: parseResult.fieldErrors }

  try {
    const updated = await dbUpdateItem(itemId, authResult.userId, parseResult.data)
    if (!updated) return { success: false as const, error: 'Item not found.' }
    return { success: true as const, data: updated }
  } catch {
    return { success: false as const, error: 'Failed to update item.' }
  }
}

export async function deleteItem(itemId: string) {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  try {
    const deleted = await dbDeleteItem(itemId, authResult.userId)
    if (!deleted) return { success: false as const, error: 'Item not found.' }

    if (deleted.fileUrl) {
      const supabase = createSupabaseServer()
      await supabase.storage.from(SUPABASE_BUCKET).remove([deleted.fileUrl])
    }

    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Failed to delete item.' }
  }
}

export async function toggleItemFavorite(itemId: string) {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  try {
    const isFavorite = await dbToggleItemFavorite(itemId, authResult.userId)
    if (isFavorite === null) return { success: false as const, error: 'Item not found.' }
    return { success: true as const, data: { isFavorite } }
  } catch {
    return { success: false as const, error: 'Failed to update favorite.' }
  }
}

export async function toggleItemPin(itemId: string) {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  try {
    const isPinned = await dbToggleItemPin(itemId, authResult.userId)
    if (isPinned === null) return { success: false as const, error: 'Item not found.' }
    return { success: true as const, data: { isPinned } }
  } catch {
    return { success: false as const, error: 'Failed to update pin.' }
  }
}
