import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { validateNewPassword } from '@/lib/actions/validate-password'
import { parseActionInput } from '@/lib/actions/parse-action-input'
import { formatRateLimitError } from '@/lib/rate-limit'
import { getActionErrorMessage } from '@/lib/actions/action-error'

// ─── validateNewPassword ──────────────────────────────────────────────────────

describe('validateNewPassword', () => {
  it('returns ok when passwords match and meet length requirement', () => {
    expect(validateNewPassword('password123', 'password123')).toEqual({ ok: true })
  })

  it('returns ok for password exactly at the 8-character minimum', () => {
    expect(validateNewPassword('12345678', '12345678')).toEqual({ ok: true })
  })

  it('returns error when passwords do not match', () => {
    const result = validateNewPassword('password123', 'different')
    expect(result).toEqual({ ok: false, error: 'Passwords do not match.' })
  })

  it('returns error when password is shorter than 8 characters', () => {
    const result = validateNewPassword('short', 'short')
    expect(result).toEqual({ ok: false, error: 'Password must be at least 8 characters.' })
  })

  it('checks match before length so mismatch takes precedence', () => {
    const result = validateNewPassword('abc', 'xyz')
    expect(result).toEqual({ ok: false, error: 'Passwords do not match.' })
  })
})

// ─── parseActionInput ─────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().min(0),
})

describe('parseActionInput', () => {
  it('returns ok with parsed data for valid input', () => {
    const result = parseActionInput(schema, { name: 'Alice', age: 30 })
    expect(result).toEqual({ ok: true, data: { name: 'Alice', age: 30 } })
  })

  it('returns fieldErrors for missing required field', () => {
    const result = parseActionInput(schema, { age: 30 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.fieldErrors.name).toBeDefined()
    }
  })

  it('returns fieldErrors for invalid type', () => {
    const result = parseActionInput(schema, { name: 'Alice', age: -1 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.fieldErrors.age).toBeDefined()
    }
  })

  it('returns fieldErrors for completely invalid input', () => {
    const result = parseActionInput(schema, null)
    expect(result.ok).toBe(false)
  })
})

// ─── formatRateLimitError ─────────────────────────────────────────────────────

describe('formatRateLimitError', () => {
  it('returns singular "minute" when reset is exactly 1 minute away', () => {
    const reset = Date.now() + 60_000
    const msg = formatRateLimitError(reset)
    expect(msg).toBe('Too many attempts. Please try again in 1 minute.')
  })

  it('returns plural "minutes" when reset is more than 1 minute away', () => {
    const reset = Date.now() + 3 * 60_000
    const msg = formatRateLimitError(reset)
    expect(msg).toMatch(/3 minutes/)
  })

  it('rounds up a partial minute', () => {
    const reset = Date.now() + 90_000
    const msg = formatRateLimitError(reset)
    expect(msg).toMatch(/2 minutes/)
  })

  it('returns at least 1 minute for an already-elapsed reset time', () => {
    const msg = formatRateLimitError(Date.now() - 10_000)
    expect(msg).toBe('Too many attempts. Please try again in 1 minute.')
  })
})

// ─── getActionErrorMessage ────────────────────────────────────────────────────

describe('getActionErrorMessage', () => {
  it('returns the error string when error is a string', () => {
    expect(getActionErrorMessage('Something specific went wrong.', 'fallback')).toBe('Something specific went wrong.')
  })

  it('returns the fallback when error is undefined', () => {
    expect(getActionErrorMessage(undefined, 'Default error.')).toBe('Default error.')
  })

  it('returns the fallback when error is an object', () => {
    expect(getActionErrorMessage({ code: 'E001' }, 'Default error.')).toBe('Default error.')
  })

  it('returns the fallback when error is null', () => {
    expect(getActionErrorMessage(null, 'Default error.')).toBe('Default error.')
  })

  it('returns the fallback when error is a number', () => {
    expect(getActionErrorMessage(500, 'Default error.')).toBe('Default error.')
  })

  it('returns empty string when error is an empty string', () => {
    expect(getActionErrorMessage('', 'fallback')).toBe('')
  })
})
