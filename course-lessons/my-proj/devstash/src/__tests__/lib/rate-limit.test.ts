import { describe, it, expect } from 'vitest'
import { getIpFromHeaders } from '@/lib/rate-limit'

const makeHeaders = (map: Record<string, string>) => ({
  get: (name: string) => map[name] ?? null,
})

describe('getIpFromHeaders', () => {
  it('returns the first IP from x-forwarded-for', () => {
    expect(getIpFromHeaders(makeHeaders({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4')
  })

  it('falls back to 127.0.0.1 when header is absent', () => {
    expect(getIpFromHeaders(makeHeaders({}))).toBe('127.0.0.1')
  })

  it('trims whitespace from the extracted IP', () => {
    expect(getIpFromHeaders(makeHeaders({ 'x-forwarded-for': '  9.9.9.9  , 1.1.1.1' }))).toBe('9.9.9.9')
  })
})
