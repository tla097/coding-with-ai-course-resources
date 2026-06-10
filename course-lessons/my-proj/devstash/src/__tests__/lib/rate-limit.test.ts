import { describe, it, expect } from 'vitest'
import { getIpFromHeaders } from '@/lib/rate-limit'

const makeHeaders = (map: Record<string, string>) => ({
  get: (name: string) => map[name] ?? null,
})

describe('getIpFromHeaders', () => {
  describe('x-forwarded-for', () => {
    it('returns the rightmost IP (proxy-appended, not client-controlled)', () => {
      expect(getIpFromHeaders(makeHeaders({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('5.6.7.8')
    })

    it('returns the only IP when there is a single value', () => {
      expect(getIpFromHeaders(makeHeaders({ 'x-forwarded-for': '1.2.3.4' }))).toBe('1.2.3.4')
    })

    it('trims whitespace from the rightmost IP', () => {
      expect(getIpFromHeaders(makeHeaders({ 'x-forwarded-for': '9.9.9.9 ,  1.1.1.1  ' }))).toBe('1.1.1.1')
    })

    it('returns rightmost when chain has three hops', () => {
      expect(getIpFromHeaders(makeHeaders({ 'x-forwarded-for': '10.0.0.1, 10.0.0.2, 10.0.0.3' }))).toBe('10.0.0.3')
    })
  })

  describe('trusted proxy headers', () => {
    it('prefers cf-connecting-ip over x-forwarded-for', () => {
      expect(
        getIpFromHeaders(makeHeaders({
          'cf-connecting-ip': '203.0.113.1',
          'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        })),
      ).toBe('203.0.113.1')
    })

    it('prefers x-real-ip over x-forwarded-for', () => {
      expect(
        getIpFromHeaders(makeHeaders({
          'x-real-ip': '203.0.113.2',
          'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        })),
      ).toBe('203.0.113.2')
    })

    it('prefers cf-connecting-ip over x-real-ip', () => {
      expect(
        getIpFromHeaders(makeHeaders({
          'cf-connecting-ip': '203.0.113.1',
          'x-real-ip': '203.0.113.2',
        })),
      ).toBe('203.0.113.1')
    })

    it('trims whitespace from cf-connecting-ip', () => {
      expect(getIpFromHeaders(makeHeaders({ 'cf-connecting-ip': '  1.2.3.4  ' }))).toBe('1.2.3.4')
    })
  })

  describe('fallback', () => {
    it('falls back to 127.0.0.1 when no headers are present', () => {
      expect(getIpFromHeaders(makeHeaders({}))).toBe('127.0.0.1')
    })
  })
})
