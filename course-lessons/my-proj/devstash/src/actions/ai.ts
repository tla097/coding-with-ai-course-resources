'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { gemini, AI_MODEL } from '@/lib/gemini'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_CONTENT_LENGTH = 2000

const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(50000).optional().default(''),
  itemType: z.string().trim().min(1),
})

export type GenerateAutoTagsInput = z.input<typeof generateAutoTagsSchema>

export async function generateAutoTags(data: GenerateAutoTagsInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }
  if (!session.user.isPro) return { success: false as const, error: 'Pro plan required.' }

  const parsed = generateAutoTagsSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Invalid input.' }

  const limit = await checkRateLimit(`ai:tags:${session.user.id}`, 5, '1 m')
  if (!limit.success) return { success: false as const, error: 'Rate limit reached. Try again later.' }

  const { title, content, itemType } = parsed.data
  const sanitizedContent = content
    .trim()
    .slice(0, MAX_CONTENT_LENGTH)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

  try {
    const response = await gemini.models.generateContent({
      model: AI_MODEL,
      contents: `Suggest 3-5 short, relevant tags for this ${itemType} item.
Title: ${title}
Content: ${sanitizedContent}

Return ONLY a JSON array of lowercase tag strings, no explanation. Example: ["react","hooks","typescript"]`,
    })

    const raw = response.text?.trim() ?? '[]'
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const tags: string[] = JSON.parse(cleaned)

    if (!Array.isArray(tags)) return { success: false as const, error: 'Failed to parse tags.' }

    return {
      success: true as const,
      data: { tags: tags.filter(t => typeof t === 'string' && t.trim().length > 0).slice(0, 5) },
    }
  } catch {
    return { success: false as const, error: 'Failed to generate tags.' }
  }
}
