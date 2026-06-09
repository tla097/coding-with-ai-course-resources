import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"
import { checkRateLimit, getIpFromHeaders, rateLimitResponse } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
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
    const token = randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    })

    const baseUrl = new URL(req.url).origin
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`

    await sendVerificationEmail(email, name, verifyUrl)
  }

  return Response.json({ success: true, verified: emailVerificationDisabled }, { status: 201 })
}
