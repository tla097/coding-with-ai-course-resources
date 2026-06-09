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

const generateDescriptionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(50000).optional().default(''),
  url: z.string().trim().max(2000).optional().default(''),
  itemType: z.string().trim().min(1),
})

const explainCodeSchema = z.object({
  content: z.string().trim().min(1).max(50000),
  itemType: z.string().trim().min(1),
  language: z.string().trim().optional(),
})

const optimizePromptSchema = z.object({
  content: z.string().trim().min(1).max(50000),
})

export type GenerateDescriptionInput = z.input<typeof generateDescriptionSchema>
export type GenerateAutoTagsInput = z.input<typeof generateAutoTagsSchema>
export type ExplainCodeInput = z.input<typeof explainCodeSchema>
export type OptimizePromptInput = z.input<typeof optimizePromptSchema>

export async function generateDescription(data: GenerateDescriptionInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }
  if (!session.user.isPro) return { success: false as const, error: 'Pro plan required.' }

  const parsed = generateDescriptionSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Invalid input.' }

  const limit = await checkRateLimit(`ai:description:${session.user.id}`, 5, '1 m')
  if (!limit.success) return { success: false as const, error: 'Rate limit reached. Try again later.' }

  const { title, content, url, itemType } = parsed.data
  const sanitizedContent = (content || url)
    .trim()
    .slice(0, MAX_CONTENT_LENGTH)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

  try {
    const response = await gemini.models.generateContent({
      model: AI_MODEL,
      contents: `Write a concise 1-2 sentence description for this ${itemType} item.
Title: ${title}
${sanitizedContent ? `Content: ${sanitizedContent}` : ''}

Return ONLY the description text, no extra formatting or explanation.`,
    })

    const description = response.text?.trim() ?? ''
    if (!description) return { success: false as const, error: 'Failed to generate description.' }

    return { success: true as const, data: { description } }
  } catch {
    return { success: false as const, error: 'Failed to generate description.' }
  }
}

export async function explainCode(data: ExplainCodeInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }
  if (!session.user.isPro) return { success: false as const, error: 'Pro plan required.' }

  const parsed = explainCodeSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Invalid input.' }

  const limit = await checkRateLimit(`ai:explain:${session.user.id}`, 5, '1 m')
  if (!limit.success) return { success: false as const, error: 'Rate limit reached. Try again later.' }

  const { content, itemType, language } = parsed.data
  const sanitizedContent = content
    .trim()
    .slice(0, MAX_CONTENT_LENGTH)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

  try {
    const response = await gemini.models.generateContent({
      model: AI_MODEL,
      contents: `Explain this ${language ? `${language} ` : ''}${itemType} in plain English. Be concise (~200-300 words). Cover what it does and any key concepts or patterns used.

${sanitizedContent}

Return a clear explanation in markdown format.`,
    })

    const explanation = response.text?.trim() ?? ''
    if (!explanation) return { success: false as const, error: 'Failed to generate explanation.' }

    return { success: true as const, data: { explanation } }
  } catch {
    return { success: false as const, error: 'Failed to generate explanation.' }
  }
}

export async function optimizePrompt(data: OptimizePromptInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Not authenticated.' }
  if (!session.user.isPro) return { success: false as const, error: 'Pro plan required.' }

  const parsed = optimizePromptSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Invalid input.' }

  const limit = await checkRateLimit(`ai:optimize:${session.user.id}`, 5, '1 m')
  if (!limit.success) return { success: false as const, error: 'Rate limit reached. Try again later.' }

  const { content } = parsed.data
  const sanitizedContent = content
    .trim()
    .slice(0, MAX_CONTENT_LENGTH)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')

  try {
    const response = await gemini.models.generateContent({
      model: AI_MODEL,
      contents: `You are a prompt engineering expert. Analyze the following AI prompt and improve it for clarity, specificity, and effectiveness. If the prompt is already well-written, return it with only minor improvements.

Original prompt:
${sanitizedContent}

Return ONLY the improved prompt text, no explanation or commentary.`,
    })

    const optimized = response.text?.trim() ?? ''
    if (!optimized) return { success: false as const, error: 'Failed to optimize prompt.' }

    return { success: true as const, data: { optimized } }
  } catch {
    return { success: false as const, error: 'Failed to optimize prompt.' }
  }
}

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
