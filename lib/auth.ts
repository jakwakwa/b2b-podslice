"use server"

import { cookies } from "next/headers"
import { sql } from "./db"

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value

  if (!userId) {
    return null
  }

  const users = await sql`
    SELECT u.*, o.name as organization_name, o.slug as organization_slug
    FROM users u
    LEFT JOIN organizations o ON o.id = u.organization_id
    WHERE u.id = ${userId}
    LIMIT 1
  `

  return users[0] || null
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
