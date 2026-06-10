import { describe, it, expect, vi, afterEach } from 'vitest'
import { singleton } from '@/lib/singleton'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('singleton', () => {
  it('calls create on first invocation', () => {
    const create = vi.fn(() => ({ id: 'a' }))
    singleton('__test_singleton_a__', create)
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('returns the created instance', () => {
    const obj = { id: 'b' }
    const result = singleton('__test_singleton_b__', () => obj)
    expect(result).toBe(obj)
  })

  it('returns the same instance on subsequent calls (dev mode persists to globalThis)', () => {
    const create = vi.fn(() => ({ id: 'c' }))
    const first = singleton('__test_singleton_c__', create)
    const second = singleton('__test_singleton_c__', create)
    expect(first).toBe(second)
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('does not persist to globalThis in production — create is called each time', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const name = '__test_singleton_prod__'
    ;(globalThis as Record<string, unknown>)[name] = undefined
    const create = vi.fn(() => ({ id: 'd' }))
    singleton(name, create)
    singleton(name, create)
    expect(create).toHaveBeenCalledTimes(2)
  })

  it('reuses an existing globalThis value without calling create again', () => {
    const name = '__test_singleton_existing__'
    const existing = { id: 'preexisting' }
    ;(globalThis as Record<string, unknown>)[name] = existing
    const create = vi.fn(() => ({ id: 'new' }))
    const result = singleton(name, create)
    expect(result).toBe(existing)
    expect(create).not.toHaveBeenCalled()
  })
})
