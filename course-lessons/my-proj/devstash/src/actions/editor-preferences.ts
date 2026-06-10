'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { requireAuth } from '@/lib/actions/require-auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_EDITOR_PREFERENCES } from '@/types/editor-preferences'

const schema = z.object({
  fontSize: z.number().int().min(8).max(32),
  tabSize: z.number().int().refine(v => [2, 4, 8].includes(v)),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(['vs-dark', 'monokai', 'github-dark']),
})

export async function updateEditorPreferences(input: unknown) {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: 'Invalid preferences.' }

  await prisma.user.update({
    where: { id: authResult.userId },
    data: { editorPreferences: parsed.data },
  })

  return { success: true }
}

export async function getEditorPreferences() {
  const session = await auth()
  if (!session?.user?.id) return DEFAULT_EDITOR_PREFERENCES

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { editorPreferences: true },
  })

  if (!user?.editorPreferences) return DEFAULT_EDITOR_PREFERENCES

  const parsed = schema.safeParse(user.editorPreferences)
  return parsed.success ? parsed.data : DEFAULT_EDITOR_PREFERENCES
}
