import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
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

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })

  return Response.json({ success: true }, { status: 201 })
}
