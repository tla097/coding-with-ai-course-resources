'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { gemini, AI_MODEL } from '@/lib/gemini'
import { checkRateLimit } from '@/lib/rate-limit'

const MAX_CONTENT_LENGTH = 2000

type ProUserResult = { ok: true; userId: string } | { ok: false; error: string }

async function requireProUser(): Promise<ProUserResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Not authenticated.' }
  if (!session.user.isPro) return { ok: false, error: 'Pro plan required.' }
  return { ok: true, userId: session.user.id }
}

function sanitiseContent(raw: string): string {
  return raw.trim().slice(0, MAX_CONTENT_LENGTH).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
}

async function callGemini(
  prompt: string,
  errorMsg: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const response = await gemini.models.generateContent({ model: AI_MODEL, contents: prompt })
    const text = response.text?.trim() ?? ''
    if (!text) return { ok: false, error: errorMsg }
    return { ok: true, text }
  } catch {
    return { ok: false, error: errorMsg }
  }
}

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
  const authResult = await requireProUser()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const parsed = generateDescriptionSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Invalid input.' }

  const limit = await checkRateLimit(`ai:description:${authResult.userId}`, 5, '1 m')
  if (!limit.success) return { success: false as const, error: 'Rate limit reached. Try again later.' }

  const { title, content, url, itemType } = parsed.data
  const sanitizedContent = sanitiseContent(content || url)

  const result = await callGemini(
    `Write a concise 1-2 sentence description for this ${itemType} item.
Title: ${title}
${sanitizedContent ? `Content: ${sanitizedContent}` : ''}

Return ONLY the description text, no extra formatting or explanation.`,
    'Failed to generate description.',
  )
  if (!result.ok) return { success: false as const, error: result.error }
  return { success: true as const, data: { description: result.text } }
}

export async function explainCode(data: ExplainCodeInput) {
  const authResult = await requireProUser()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const parsed = explainCodeSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Invalid input.' }

  const limit = await checkRateLimit(`ai:explain:${authResult.userId}`, 5, '1 m')
  if (!limit.success) return { success: false as const, error: 'Rate limit reached. Try again later.' }

  const { content, itemType, language } = parsed.data
  const sanitizedContent = sanitiseContent(content)

  const result = await callGemini(
    `Explain this ${language ? `${language} ` : ''}${itemType} in plain English. Be concise (~200-300 words). Cover what it does and any key concepts or patterns used.

${sanitizedContent}

Return a clear explanation in markdown format.`,
    'Failed to generate explanation.',
  )
  if (!result.ok) return { success: false as const, error: result.error }
  return { success: true as const, data: { explanation: result.text } }
}

export async function optimizePrompt(data: OptimizePromptInput) {
  const authResult = await requireProUser()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const parsed = optimizePromptSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Invalid input.' }

  const limit = await checkRateLimit(`ai:optimize:${authResult.userId}`, 5, '1 m')
  if (!limit.success) return { success: false as const, error: 'Rate limit reached. Try again later.' }

  const { content } = parsed.data
  const sanitizedContent = sanitiseContent(content)

  const result = await callGemini(
    `You are a prompt engineering expert. Analyze the following AI prompt and improve it for clarity, specificity, and effectiveness. If the prompt is already well-written, return it with only minor improvements.

Original prompt:
${sanitizedContent}

Return ONLY the improved prompt text, no explanation or commentary.`,
    'Failed to optimize prompt.',
  )
  if (!result.ok) return { success: false as const, error: result.error }
  return { success: true as const, data: { optimized: result.text } }
}

export async function generateAutoTags(data: GenerateAutoTagsInput) {
  const authResult = await requireProUser()
  if (!authResult.ok) return { success: false as const, error: authResult.error }

  const parsed = generateAutoTagsSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: 'Invalid input.' }

  const limit = await checkRateLimit(`ai:tags:${authResult.userId}`, 5, '1 m')
  if (!limit.success) return { success: false as const, error: 'Rate limit reached. Try again later.' }

  const { title, content, itemType } = parsed.data
  const sanitizedContent = sanitiseContent(content)

  const result = await callGemini(
    `Suggest 3-5 short, relevant tags for this ${itemType} item.
Title: ${title}
Content: ${sanitizedContent}

Return ONLY a JSON array of lowercase tag strings, no explanation. Example: ["react","hooks","typescript"]`,
    'Failed to generate tags.',
  )
  if (!result.ok) return { success: false as const, error: result.error }

  try {
    const cleaned = result.text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
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
