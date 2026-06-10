export function singleton<T>(name: string, create: () => T): T {
  const g = globalThis as unknown as Record<string, T | undefined>
  const instance = g[name] ?? create()
  if (process.env.NODE_ENV !== 'production') g[name] = instance
  return instance
}
