"use server"

import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { setCurrentUser, signOut as authSignOut } from "@/lib/auth"
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email"

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const passwordData = encoder.encode(password)

  const keyMaterial = await crypto.subtle.importKey("raw", passwordData, "PBKDF2", false, ["deriveBits"])

  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-512",
    },
    keyMaterial,
    512,
  )

  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  const hashHex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return `${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [saltHex, originalHash] = hashedPassword.split(":")
  const encoder = new TextEncoder()
  const passwordData = encoder.encode(password)

  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)))

  const keyMaterial = await crypto.subtle.importKey("raw", passwordData, "PBKDF2", false, ["deriveBits"])

  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-512",
    },
    keyMaterial,
    512,
  )

  const hashHex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return hashHex === originalHash
}

async function generateToken(): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function signIn(email: string, password: string) {
  try {
    const user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      return { error: "Invalid credentials" }
    }

    // Check if user has a password hash (for backward compatibility)
    if (user.password_hash) {
      const isValid = await verifyPassword(password, user.password_hash)
      if (!isValid) {
        return { error: "Invalid credentials" }
      }
    }

    // Check if email is verified
    if (!user.email_verified) {
      return { error: "Please verify your email address before signing in" }
    }

    await setCurrentUser(user.id)
  } catch (error) {
    console.error("[v0] Sign in error:", error)
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error // Re-throw redirect errors
    }
    return { error: "An error occurred during sign in. Please try again." }
  }
  
  redirect("/dashboard")
}

export async function signUp(data: {
  email: string
  password: string
  fullName: string
  organizationName: string
}) {
  // Check if user already exists
  const existingUser = await prisma.users.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    return { error: "User already exists" }
  }

  // Hash password
  const passwordHash = await hashPassword(data.password)

  try {
    // Create organization
    const organization = await prisma.organizations.create({
      data: {
        name: data.organizationName,
        slug: data.organizationName.toLowerCase().replace(/\s+/g, "-"),
      },
    })

    // Create user as admin
    const user = await prisma.users.create({
      data: {
        email: data.email,
        full_name: data.fullName,
        role: "admin",
        organization_id: organization.id,
        password_hash: passwordHash,
        email_verified: false,
      },
    })

    // Generate verification token
    const token = await generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.email_verification_tokens.create({
      data: {
        user_id: user.id,
        token,
        expires_at: expiresAt,
      },
    })

    // Send verification email
    await sendVerificationEmail(data.email, token)

    return {
      success: true,
      message: "Account created! Please check your email to verify your account.",
    }
  } catch (error) {
    console.error("[v0] Sign up error:", error)
    return { error: "Failed to create account. Please try again." }
  }
}

export async function verifyEmail(token: string) {
  const verificationToken = await prisma.email_verification_tokens.findUnique({
    where: { token },
  })

  if (!verificationToken || verificationToken.expires_at < new Date()) {
    return { error: "Invalid or expired verification token" }
  }

  try {
    // Update user as verified
    await prisma.users.update({
      where: { id: verificationToken.user_id },
      data: {
        email_verified: true,
        email_verified_at: new Date(),
      },
    })

    // Delete used token
    await prisma.email_verification_tokens.delete({
      where: { id: verificationToken.id },
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Email verification error:", error)
    return { error: "Failed to verify email. Please try again." }
  }
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.users.findUnique({
    where: { email },
  })

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true, message: "If an account exists, a reset link has been sent." }
  }

  try {
    // Generate reset token
    const token = await generateToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.password_reset_tokens.create({
      data: {
        user_id: user.id,
        token,
        expires_at: expiresAt,
      },
    })

    // Send reset email
    await sendPasswordResetEmail(email, token)

    return {
      success: true,
      message: "If an account exists, a reset link has been sent.",
    }
  } catch (error) {
    console.error("[v0] Password reset request error:", error)
    return {
      success: true,
      message: "If an account exists, a reset link has been sent.",
    }
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.password_reset_tokens.findUnique({
    where: { token },
  })

  if (!resetToken || resetToken.expires_at < new Date() || resetToken.used_at) {
    return { error: "Invalid or expired reset token" }
  }

  try {
    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user password
    await prisma.users.update({
      where: { id: resetToken.user_id },
      data: { password_hash: passwordHash },
    })

    // Mark token as used
    await prisma.password_reset_tokens.update({
      where: { id: resetToken.id },
      data: { used_at: new Date() },
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Password reset error:", error)
    return { error: "Failed to reset password. Please try again." }
  }
}

export async function resendVerificationEmail(email: string) {
  const user = await prisma.users.findUnique({
    where: { email },
  })

  // Always return a generic success to avoid email enumeration
  if (!user) {
    return { success: true, message: "If an account exists, a verification email has been sent." }
  }

  if (user.email_verified) {
    return { success: true, message: "If an account exists, a verification email has been sent." }
  }

  try {
    // Simple rate limit: avoid resending if a token was created within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentToken = await prisma.email_verification_tokens.findFirst({
      where: {
        user_id: user.id,
        created_at: {
          gt: fiveMinutesAgo,
        },
      },
    })

    if (recentToken) {
      return { success: true, message: "If an account exists, a verification email has been sent." }
    }

    // Delete old tokens
    await prisma.email_verification_tokens.deleteMany({
      where: { user_id: user.id },
    })

    // Generate new token
    const token = await generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.email_verification_tokens.create({
      data: {
        user_id: user.id,
        token,
        expires_at: expiresAt,
      },
    })

    // Send verification email
    await sendVerificationEmail(email, token)

    return { success: true, message: "If an account exists, a verification email has been sent." }
  } catch (error) {
    console.error("[v0] Resend verification email error:", error)
    return { success: true, message: "If an account exists, a verification email has been sent." }
  }
}

export async function signOut() {
  await authSignOut()
  redirect("/")
}
