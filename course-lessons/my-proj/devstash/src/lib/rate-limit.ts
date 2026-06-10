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
  // cf-connecting-ip / x-real-ip are set by the proxy and cannot be spoofed by clients
  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  // Use the rightmost value — appended by our own reverse proxy, not the client
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',')
    return ips[ips.length - 1].trim()
  }

  return '127.0.0.1'
}

export function formatRateLimitError(reset: number): string {
  const minutes = Math.max(1, Math.ceil(Math.max(0, reset - Date.now()) / 60000))
  return `Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`
}

export function rateLimitResponse(reset: number): Response {
  const retryAfterSecs = Math.ceil(Math.max(0, reset - Date.now()) / 1000)
  return Response.json(
    { error: formatRateLimitError(reset) },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSecs) },
    },
  )
}