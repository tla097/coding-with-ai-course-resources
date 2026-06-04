'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { updateItem as dbUpdateItem } from '@/lib/db/items'

const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional().nullable().transform(v => v ?? null),
  content: z.string().optional().nullable().transform(v => v ?? null),
  url: z.url('Invalid URL').optional().nullable().transform(v => v ?? null),
  language: z.string().trim().optional().nullable().transform(v => v ?? null),
  tags: z.array(z.string().trim().min(1)).default([]),
})

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
