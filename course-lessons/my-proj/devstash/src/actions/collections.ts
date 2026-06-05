'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { createCollection as dbCreateCollection } from '@/lib/db/collections'

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
