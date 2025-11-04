import { PrismaClient } from "../app/generated/prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const databaseUrl = process.env.DATABASE_URL
const isAccelerateUrl = Boolean(
  databaseUrl?.startsWith("prisma://") ||
    databaseUrl?.startsWith("prisma+postgres://"),
)

const baseClient =
  globalForPrisma.prisma || new PrismaClient({ datasourceUrl: databaseUrl })

const prisma = isAccelerateUrl ? baseClient.$extends(withAccelerate()) : baseClient

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
