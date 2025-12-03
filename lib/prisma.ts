import { PrismaClient } from "../app/generated/prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const databaseUrl = process.env.DATABASE_URL
const isAccelerateUrl = Boolean(
  databaseUrl?.startsWith("prisma://") ||
    databaseUrl?.startsWith("prisma+postgres://"),
)

const baseClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

// Type the client consistently to avoid union type issues
const prisma = (isAccelerateUrl ? baseClient.$extends(withAccelerate()) : baseClient) as unknown as PrismaClient

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = baseClient

// Graceful shutdown
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect()
  })
}

export default prisma
