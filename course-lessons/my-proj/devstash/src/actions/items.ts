'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import {
  createItem as dbCreateItem,
  updateItem as dbUpdateItem,
  deleteItem as dbDeleteItem,
} from '@/lib/db/items'

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional().nullable().transform(v => v ?? null),
  content: z.string().optional().nullable().transform(v => v ?? null),
  url: z.url('Invalid URL').optional().nullable().transform(v => v ?? null),
  language: z.string().trim().optional().nullable().transform(v => v ?? null),
  tags: z.array(z.string().trim().min(1)).default([]),
  collectionIds: z.array(z.string()).default([]),
})

const ITEM_TYPE_NAMES = ['snippet', 'prompt', 'command', 'note', 'link'] as const

const createItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional().nullable().transform(v => v ?? null),
  content: z.string().optional().nullable().transform(v => v ?? null),
  url: z.url('Invalid URL').optional().nullable().transform(v => v ?? null),
  language: z.string().trim().optional().nullable().transform(v => v ?? null),
  tags: z.array(z.string().trim().min(1)).default([]),
  collectionIds: z.array(z.string()).default([]),
  itemTypeId: z.string().min(1, 'Item type is required'),
  itemTypeName: z.enum(ITEM_TYPE_NAMES),
}).superRefine((data, ctx) => {
  if (data.itemTypeName === 'link' && !data.url) {
    ctx.addIssue({ code: 'custom', message: 'URL is required', path: ['url'] })
  }
})

export type CreateItemInput = z.input<typeof createItemSchema>

export async function createItem(data: CreateItemInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }

  const parsed = createItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: z.flattenError(parsed.error).fieldErrors }
  }

  const { title, description, content, url, language, tags, collectionIds, itemTypeId, itemTypeName } = parsed.data
  const contentType: 'TEXT' | 'URL' = itemTypeName === 'link' ? 'URL' : 'TEXT'

  try {
    const created = await dbCreateItem(session.user.id, {
      title, description, content, url, language, tags, collectionIds, itemTypeId, contentType,
    })
    return { success: true as const, data: created }
  } catch {
    return { success: false as const, error: 'Failed to create item.' }
  }
}

export type UpdateItemInput = z.input<typeof updateItemSchema>

export async function updateItem(itemId: string, data: UpdateItemInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }

  const parsed = updateItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: z.flattenError(parsed.error).fieldErrors }
  }

  try {
    const updated = await dbUpdateItem(itemId, session.user.id, parsed.data)
    if (!updated) return { success: false as const, error: 'Item not found.' }
    return { success: true as const, data: updated }
  } catch {
    return { success: false as const, error: 'Failed to update item.' }
  }
}

export async function deleteItem(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }

  try {
    const deleted = await dbDeleteItem(itemId, session.user.id)
    if (!deleted) return { success: false as const, error: 'Item not found.' }
    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Failed to delete item.' }
  }
}
