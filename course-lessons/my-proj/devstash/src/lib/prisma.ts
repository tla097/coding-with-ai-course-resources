import { PrismaClient } from "@/generated/prisma/client"
import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import ws from "ws"
import { singleton } from "@/lib/singleton"

neonConfig.webSocketConstructor = ws

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({ adapter })
}

export const prisma = singleton('prisma', createPrismaClient)

