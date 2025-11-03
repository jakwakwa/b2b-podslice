"use server"

import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { setCurrentUser, signOut as authSignOut } from "@/lib/auth"
import { hashPassword, verifyPassword, generateToken } from "@/lib/crypto"
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email"

export async function signIn(email: string, password: string) {
  const users = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `

  if (users.length === 0) {
    return { error: "Invalid credentials" }
  }

  const user = users[0]

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
  redirect("/dashboard")
}

export async function signUp(data: {
  email: string
  password: string
  fullName: string
  organizationName: string
}) {
  // Check if user already exists
  const existingUsers = await sql`
    SELECT id FROM users WHERE email = ${data.email} LIMIT 1
  `

  if (existingUsers.length > 0) {
    return { error: "User already exists" }
  }

  // Hash password
  const passwordHash = await hashPassword(data.password)

  // Create organization
  const organizations = await sql`
    INSERT INTO organizations (name, slug)
    VALUES (
      ${data.organizationName},
      ${data.organizationName.toLowerCase().replace(/\s+/g, "-")}
    )
    RETURNING id
  `

  const organizationId = organizations[0].id

  // Create user as admin
  const users = await sql`
    INSERT INTO users (email, full_name, role, organization_id, password_hash, email_verified)
    VALUES (${data.email}, ${data.fullName}, 'admin', ${organizationId}, ${passwordHash}, false)
    RETURNING id
  `

  const userId = users[0].id

  // Generate verification token
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await sql`
    INSERT INTO email_verification_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `

  // Send verification email
  await sendVerificationEmail(data.email, token)

  return {
    success: true,
    message: "Account created! Please check your email to verify your account.",
  }
}

export async function verifyEmail(token: string) {
  const tokens = await sql`
    SELECT * FROM email_verification_tokens 
    WHERE token = ${token} AND expires_at > NOW()
    LIMIT 1
  `

  if (tokens.length === 0) {
    return { error: "Invalid or expired verification token" }
  }

  const verificationToken = tokens[0]

  // Update user as verified
  await sql`
    UPDATE users 
    SET email_verified = true, email_verified_at = NOW()
    WHERE id = ${verificationToken.user_id}
  `

  // Delete used token
  await sql`
    DELETE FROM email_verification_tokens WHERE id = ${verificationToken.id}
  `

  return { success: true }
}

export async function requestPasswordReset(email: string) {
  const users = await sql`
    SELECT id FROM users WHERE email = ${email} LIMIT 1
  `

  // Always return success to prevent email enumeration
  if (users.length === 0) {
    return { success: true, message: "If an account exists, a reset link has been sent." }
  }

  const userId = users[0].id

  // Generate reset token
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await sql`
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `

  // Send reset email
  await sendPasswordResetEmail(email, token)

  return {
    success: true,
    message: "If an account exists, a reset link has been sent.",
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const tokens = await sql`
    SELECT * FROM password_reset_tokens 
    WHERE token = ${token} AND expires_at > NOW() AND used_at IS NULL
    LIMIT 1
  `

  if (tokens.length === 0) {
    return { error: "Invalid or expired reset token" }
  }

  const resetToken = tokens[0]

  // Hash new password
  const passwordHash = await hashPassword(newPassword)

  // Update user password
  await sql`
    UPDATE users 
    SET password_hash = ${passwordHash}
    WHERE id = ${resetToken.user_id}
  `

  // Mark token as used
  await sql`
    UPDATE password_reset_tokens 
    SET used_at = NOW()
    WHERE id = ${resetToken.id}
  `

  return { success: true }
}

export async function resendVerificationEmail(email: string) {
  const users = await sql`
    SELECT id, email_verified FROM users WHERE email = ${email} LIMIT 1
  `

  if (users.length === 0) {
    return { error: "User not found" }
  }

  if (users[0].email_verified) {
    return { error: "Email already verified" }
  }

  const userId = users[0].id

  // Delete old tokens
  await sql`
    DELETE FROM email_verification_tokens WHERE user_id = ${userId}
  `

  // Generate new token
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await sql`
    INSERT INTO email_verification_tokens (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `

  // Send verification email
  await sendVerificationEmail(email, token)

  return { success: true, message: "Verification email sent!" }
}

export async function signOut() {
  await authSignOut()
  redirect("/")
}
