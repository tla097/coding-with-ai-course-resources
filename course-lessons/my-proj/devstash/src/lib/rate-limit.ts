import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type Duration = `${number} ms` | `${number} s` | `${number} m` | `${number} h` | `${number} d`

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  duration: Duration,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return { success: true, remaining: maxRequests, reset: 0 }
    }
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, duration),
      analytics: false,
    })
    const result = await limiter.limit(key)
    return { success: result.success, remaining: result.remaining, reset: result.reset }
  } catch {
    return { success: true, remaining: maxRequests, reset: 0 }
  }
}

export function getIpFromHeaders(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return '127.0.0.1'
}

export function rateLimitResponse(reset: number): Response {
  const now = Date.now()
  const retryAfterMs = Math.max(0, reset - now)
  const retryAfterSecs = Math.ceil(retryAfterMs / 1000)
  const minutes = Math.max(1, Math.ceil(retryAfterSecs / 60))
  return Response.json(
    {
      error: `Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSecs) },
    },
  )
}