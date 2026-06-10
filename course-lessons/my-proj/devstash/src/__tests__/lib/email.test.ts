import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/resend', () => ({
  resend: {
    emails: {
      send: vi.fn(),
    },
  },
}))

import { sendVerificationEmail } from '@/lib/email'
import { resend } from '@/lib/resend'

const mockSend = vi.mocked(resend.emails.send)

beforeEach(() => {
  vi.clearAllMocks()
  mockSend.mockResolvedValue({ error: null } as never)
})

describe('sendVerificationEmail', () => {
  describe('HTML injection prevention (escapeHtml)', () => {
    it('escapes < and > in the name', async () => {
      await sendVerificationEmail('user@example.com', '<script>alert(1)</script>', 'https://example.com/verify')
      const html = mockSend.mock.calls[0][0].html as string
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
      expect(html).not.toContain('<script>')
    })

    it('escapes & in the name', async () => {
      await sendVerificationEmail('user@example.com', 'Tom & Jerry', 'https://example.com/verify')
      const html = mockSend.mock.calls[0][0].html as string
      expect(html).toContain('Tom &amp; Jerry')
      expect(html).not.toContain('Tom & Jerry')
    })

    it('escapes double quotes in the name', async () => {
      await sendVerificationEmail('user@example.com', 'The "Dev"', 'https://example.com/verify')
      const html = mockSend.mock.calls[0][0].html as string
      expect(html).toContain('The &quot;Dev&quot;')
    })

    it('escapes single quotes in the name', async () => {
      await sendVerificationEmail('user@example.com', "O'Brien", 'https://example.com/verify')
      const html = mockSend.mock.calls[0][0].html as string
      expect(html).toContain('O&#39;Brien')
    })

    it('does not alter plain text names', async () => {
      await sendVerificationEmail('user@example.com', 'Tom Armstrong', 'https://example.com/verify')
      const html = mockSend.mock.calls[0][0].html as string
      expect(html).toContain('Welcome to DevStash, Tom Armstrong!')
    })
  })

  it('sends to the correct email address', async () => {
    await sendVerificationEmail('target@example.com', 'Tom', 'https://example.com/verify')
    expect(mockSend.mock.calls[0][0].to).toBe('target@example.com')
  })

  it('throws when Resend returns an error', async () => {
    mockSend.mockResolvedValue({ error: { message: 'Resend API failure' } } as never)
    await expect(
      sendVerificationEmail('user@example.com', 'Tom', 'https://example.com/verify'),
    ).rejects.toThrow('Resend API failure')
  })
})
