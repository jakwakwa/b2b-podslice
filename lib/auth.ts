"use server"

import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value

  if (!userId) {
    return null
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      organizations: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  })

  if (!user) {
    return null
  }

  // Flatten organization data to match expected format
  return {
    ...user,
    organization_name: user.organizations?.name || null,
    organization_slug: user.organizations?.slug || null,
  }
}

export async function setCurrentUser(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set("user_id", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete("user_id")
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  return user
}
