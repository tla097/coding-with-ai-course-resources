import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 4, reset: 0 }),
}))
vi.mock('@/lib/gemini', () => ({
  gemini: { models: { generateContent: vi.fn() } },
  AI_MODEL: 'gemini-2.5-flash-lite',
}))

import { generateAutoTags } from '@/actions/ai'
import { auth } from '@/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { gemini } from '@/lib/gemini'

const mockAuth = vi.mocked(auth)
const mockCheckRateLimit = vi.mocked(checkRateLimit)
const mockGenerateContent = vi.mocked(gemini.models.generateContent)

const mockProSession = { user: { id: 'user-1', isPro: true } }
const mockFreeSession = { user: { id: 'user-1', isPro: false } }

const validInput = {
  title: 'React hooks guide',
  content: 'A guide to useState and useEffect in React.',
  itemType: 'snippet',
}

describe('generateAutoTags', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await generateAutoTags(validInput)
    expect(result).toEqual({ success: false, error: 'Not authenticated.' })
  })

  it('returns error for free users', async () => {
    mockAuth.mockResolvedValueOnce(mockFreeSession as never)
    const result = await generateAutoTags(validInput)
    expect(result).toEqual({ success: false, error: 'Pro plan required.' })
  })

  it('returns error when title is empty', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    const result = await generateAutoTags({ ...validInput, title: '' })
    expect(result).toEqual({ success: false, error: 'Invalid input.' })
  })

  it('returns error when title exceeds max length', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    const result = await generateAutoTags({ ...validInput, title: 'a'.repeat(201) })
    expect(result).toEqual({ success: false, error: 'Invalid input.' })
  })

  it('returns error when rate limit is exceeded', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockCheckRateLimit.mockResolvedValueOnce({ success: false, remaining: 0, reset: Date.now() + 60000 })
    const result = await generateAutoTags(validInput)
    expect(result).toEqual({ success: false, error: 'Rate limit reached. Try again later.' })
  })

  it('calls checkRateLimit with correct key and limits', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockGenerateContent.mockResolvedValueOnce({ text: '["react","hooks"]' } as never)
    await generateAutoTags(validInput)
    expect(mockCheckRateLimit).toHaveBeenCalledWith('ai:tags:user-1', 5, '1 m')
  })

  it('returns tags on successful call', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockGenerateContent.mockResolvedValueOnce({ text: '["react","hooks","typescript"]' } as never)
    const result = await generateAutoTags(validInput)
    expect(result).toEqual({ success: true, data: { tags: ['react', 'hooks', 'typescript'] } })
  })

  it('strips markdown code fences from response', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockGenerateContent.mockResolvedValueOnce({
      text: '```json\n["react","hooks"]\n```',
    } as never)
    const result = await generateAutoTags(validInput)
    expect(result).toEqual({ success: true, data: { tags: ['react', 'hooks'] } })
  })

  it('strips plain code fences from response', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockGenerateContent.mockResolvedValueOnce({
      text: '```\n["react","hooks"]\n```',
    } as never)
    const result = await generateAutoTags(validInput)
    expect(result).toEqual({ success: true, data: { tags: ['react', 'hooks'] } })
  })

  it('limits tags to 5 even if model returns more', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockGenerateContent.mockResolvedValueOnce({
      text: '["a","b","c","d","e","f","g"]',
    } as never)
    const result = await generateAutoTags(validInput)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.tags).toHaveLength(5)
  })

  it('filters out non-string entries from tag array', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockGenerateContent.mockResolvedValueOnce({
      text: '["react", 42, null, "hooks"]',
    } as never)
    const result = await generateAutoTags(validInput)
    expect(result).toEqual({ success: true, data: { tags: ['react', 'hooks'] } })
  })

  it('returns error when model returns non-array JSON', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockGenerateContent.mockResolvedValueOnce({ text: '{"tags": ["react"]}' } as never)
    const result = await generateAutoTags(validInput)
    expect(result).toEqual({ success: false, error: 'Failed to parse tags.' })
  })

  it('returns error when model throws', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockGenerateContent.mockRejectedValueOnce(new Error('API error'))
    const result = await generateAutoTags(validInput)
    expect(result).toEqual({ success: false, error: 'Failed to generate tags.' })
  })

  it('returns error when model returns invalid JSON', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockGenerateContent.mockResolvedValueOnce({ text: 'not json at all' } as never)
    const result = await generateAutoTags(validInput)
    expect(result).toEqual({ success: false, error: 'Failed to generate tags.' })
  })

  it('handles missing content gracefully', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockGenerateContent.mockResolvedValueOnce({ text: '["react"]' } as never)
    const result = await generateAutoTags({ title: 'My item', itemType: 'note' })
    expect(result).toEqual({ success: true, data: { tags: ['react'] } })
  })

  it('truncates content to 2000 chars before sending', async () => {
    mockAuth.mockResolvedValueOnce(mockProSession as never)
    mockGenerateContent.mockResolvedValueOnce({ text: '["react"]' } as never)
    await generateAutoTags({ ...validInput, content: 'x'.repeat(5000) })
    const call = mockGenerateContent.mock.calls[0][0] as { contents: string }
    expect(call.contents).not.toContain('x'.repeat(2001))
  })
})
