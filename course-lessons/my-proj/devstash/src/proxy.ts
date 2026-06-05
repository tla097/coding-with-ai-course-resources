import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import authConfig from "./auth.config"
import { checkRateLimit, getIpFromHeaders } from "./lib/rate-limit"

const { auth } = NextAuth(authConfig)

export const proxy = auth(async function proxy(req) {
  // Rate limit login attempts before NextAuth processes them
  if (req.method === 'POST' && req.nextUrl.pathname === '/api/auth/callback/credentials') {
    const ip = getIpFromHeaders(req.headers)
    let email = 'unknown'
    try {
      const body = await req.clone().formData()
      email = (body.get('email') as string) || 'unknown'
    } catch {
      // rate limit by IP only if body can't be read
    }

    const limit = await checkRateLimit(`login:${ip}:${email}`, 5, '15 m')
    if (!limit.success) {
      const retryAfterSecs = Math.ceil(Math.max(0, limit.reset - Date.now()) / 1000)
      const minutes = Math.max(1, Math.ceil(retryAfterSecs / 60))
      const message = `Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`
      // next-auth/react's signIn() parses data.url — encode the error message there so result.error is set correctly
      const errorUrl = `${req.nextUrl.origin}/sign-in?error=${encodeURIComponent(message)}`
      return NextResponse.json(
        { url: errorUrl },
        { status: 429, headers: { 'Retry-After': String(retryAfterSecs) } },
      )
    }
  }

  const isLoggedIn = !!req.auth
  const isProtected =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname === "/profile" ||
    req.nextUrl.pathname === "/settings"

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl))
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/profile", "/settings", "/api/auth/callback/credentials"],
}