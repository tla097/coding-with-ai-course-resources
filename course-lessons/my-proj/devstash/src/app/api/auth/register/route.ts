import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { issueVerificationToken } from "@/lib/auth-tokens"
import { checkRateLimit, getIpFromHeaders, rateLimitResponse } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const ip = getIpFromHeaders(req.headers)
    const limit = await checkRateLimit(`register:${ip}`, 3, '1 h')
    if (!limit.success) return rateLimitResponse(limit.reset)

    const { name, email, password, confirmPassword } = await req.json()

    if (!name || !email || !password || !confirmPassword) {
      return Response.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return Response.json({ error: "Passwords do not match" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: "Email already in use" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const emailVerificationDisabled = process.env.DISABLE_EMAIL_VERIFICATION === "true"

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        ...(emailVerificationDisabled && { emailVerified: new Date() }),
      },
    })

    if (!emailVerificationDisabled) {
      const baseUrl = new URL(req.url).origin
      await issueVerificationToken(email, name, baseUrl)
    }

    return Response.json({ success: true, verified: emailVerificationDisabled }, { status: 201 })
  } catch (error) {
    console.error('[register]', error)
    return Response.json({ error: "Registration failed. Please try again." }, { status: 500 })
  }
}
