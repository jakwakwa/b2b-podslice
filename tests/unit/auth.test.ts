import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDeep, mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@/app/generated/prisma/client"

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: mockDeep<PrismaClient>(),
}))

// Mock email sending
vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}))

// Mock auth helpers
vi.mock("@/lib/auth", () => ({
  setCurrentUser: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
}))

import prisma from "@/lib/prisma"
import { signUp, signIn, verifyEmail, requestPasswordReset, resetPassword, resendVerificationEmail } from "@/app/actions/auth"
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email"
import { setCurrentUser } from "@/lib/auth"

const prismaMock = prisma as ReturnType<typeof mockDeep<PrismaClient>>

describe("Auth Actions", () => {
  beforeEach(() => {
    mockReset(prismaMock)
    vi.clearAllMocks()
  })

  describe("signUp", () => {
    it("should create a new user and organization successfully", async () => {
      const mockOrganization = {
        id: "org-123",
        name: "Test Org",
        slug: "test-org",
        logo_url: null,
        website: null,
        created_at: new Date(),
        updated_at: new Date(),
        payoneer_payee_id: null,
        payout_status: "PENDING",
        tax_form_status: "NONE",
        content_source_id: null,
      }

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        password_hash: "hashed",
        avatar_url: null,
        role: "admin",
        organization_id: "org-123",
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
        email_verified_at: null,
      }

      prismaMock.users.findUnique.mockResolvedValue(null)
      prismaMock.organizations.create.mockResolvedValue(mockOrganization)
      prismaMock.users.create.mockResolvedValue(mockUser)
      prismaMock.email_verification_tokens.create.mockResolvedValue({
        id: "token-123",
        user_id: "user-123",
        token: "verification-token",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        created_at: new Date(),
      })

      const result = await signUp({
        email: "test@example.com",
        password: "password123",
        fullName: "Test User",
        organizationName: "Test Org",
      })

      expect(result).toEqual({
        success: true,
        message: "Account created! Please check your email to verify your account.",
      })
      expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      })
      expect(prismaMock.organizations.create).toHaveBeenCalled()
      expect(prismaMock.users.create).toHaveBeenCalled()
      expect(sendVerificationEmail).toHaveBeenCalled()
    })

    it("should return error if user already exists", async () => {
      prismaMock.users.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        password_hash: "hashed",
        avatar_url: null,
        role: "admin",
        organization_id: "org-123",
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        email_verified_at: new Date(),
      })

      const result = await signUp({
        email: "test@example.com",
        password: "password123",
        fullName: "Test User",
        organizationName: "Test Org",
      })

      expect(result).toEqual({ error: "User already exists" })
      expect(prismaMock.organizations.create).not.toHaveBeenCalled()
    })
  })

  describe("signIn", () => {
    it("should return error for non-existent user", async () => {
      prismaMock.users.findUnique.mockResolvedValue(null)

      const result = await signIn("nonexistent@example.com", "password123")

      expect(result).toEqual({ error: "Invalid credentials" })
    })

    it("should return error if email is not verified", async () => {
      prismaMock.users.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        password_hash: "hashed",
        avatar_url: null,
        role: "admin",
        organization_id: "org-123",
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
        email_verified_at: null,
      })

      const result = await signIn("test@example.com", "password123")

      expect(result).toEqual({ error: "Please verify your email address before signing in" })
    })
  })

  describe("verifyEmail", () => {
    it("should verify email successfully with valid token", async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60)
      prismaMock.email_verification_tokens.findUnique.mockResolvedValue({
        id: "token-123",
        user_id: "user-123",
        token: "valid-token",
        expires_at: futureDate,
        created_at: new Date(),
      })
      prismaMock.users.update.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        password_hash: "hashed",
        avatar_url: null,
        role: "admin",
        organization_id: "org-123",
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        email_verified_at: new Date(),
      })
      prismaMock.email_verification_tokens.delete.mockResolvedValue({
        id: "token-123",
        user_id: "user-123",
        token: "valid-token",
        expires_at: futureDate,
        created_at: new Date(),
      })

      const result = await verifyEmail("valid-token")

      expect(result).toEqual({ success: true })
      expect(prismaMock.users.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          email_verified: true,
          email_verified_at: expect.any(Date),
        },
      })
    })

    it("should return error for invalid or expired token", async () => {
      prismaMock.email_verification_tokens.findUnique.mockResolvedValue(null)

      const result = await verifyEmail("invalid-token")

      expect(result).toEqual({ error: "Invalid or expired verification token" })
    })

    it("should return error for expired token", async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60)
      prismaMock.email_verification_tokens.findUnique.mockResolvedValue({
        id: "token-123",
        user_id: "user-123",
        token: "expired-token",
        expires_at: pastDate,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 25),
      })

      const result = await verifyEmail("expired-token")

      expect(result).toEqual({ error: "Invalid or expired verification token" })
    })
  })

  describe("requestPasswordReset", () => {
    it("should send password reset email to existing user", async () => {
      prismaMock.users.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        password_hash: "hashed",
        avatar_url: null,
        role: "admin",
        organization_id: "org-123",
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        email_verified_at: new Date(),
      })
      prismaMock.password_reset_tokens.create.mockResolvedValue({
        id: "reset-123",
        user_id: "user-123",
        token: "reset-token",
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
        used_at: null,
        created_at: new Date(),
      })

      const result = await requestPasswordReset("test@example.com")

      expect(result).toEqual({
        success: true,
        message: "If an account exists, a reset link has been sent.",
      })
      expect(sendPasswordResetEmail).toHaveBeenCalled()
    })

    it("should return success message even for non-existent user (security)", async () => {
      prismaMock.users.findUnique.mockResolvedValue(null)

      const result = await requestPasswordReset("nonexistent@example.com")

      expect(result).toEqual({
        success: true,
        message: "If an account exists, a reset link has been sent.",
      })
      expect(sendPasswordResetEmail).not.toHaveBeenCalled()
    })
  })

  describe("resetPassword", () => {
    it("should reset password with valid token", async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000)
      prismaMock.password_reset_tokens.findUnique.mockResolvedValue({
        id: "reset-123",
        user_id: "user-123",
        token: "valid-reset-token",
        expires_at: futureDate,
        used_at: null,
        created_at: new Date(),
      })
      prismaMock.users.update.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        password_hash: "new-hashed",
        avatar_url: null,
        role: "admin",
        organization_id: "org-123",
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
        email_verified_at: new Date(),
      })
      prismaMock.password_reset_tokens.update.mockResolvedValue({
        id: "reset-123",
        user_id: "user-123",
        token: "valid-reset-token",
        expires_at: futureDate,
        used_at: new Date(),
        created_at: new Date(),
      })

      const result = await resetPassword("valid-reset-token", "newPassword123")

      expect(result).toEqual({ success: true })
      expect(prismaMock.users.update).toHaveBeenCalled()
      expect(prismaMock.password_reset_tokens.update).toHaveBeenCalled()
    })

    it("should return error for invalid or expired token", async () => {
      prismaMock.password_reset_tokens.findUnique.mockResolvedValue(null)

      const result = await resetPassword("invalid-token", "newPassword123")

      expect(result).toEqual({ error: "Invalid or expired reset token" })
    })

    it("should return error for already used token", async () => {
      prismaMock.password_reset_tokens.findUnique.mockResolvedValue({
        id: "reset-123",
        user_id: "user-123",
        token: "used-token",
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
        used_at: new Date(),
        created_at: new Date(),
      })

      const result = await resetPassword("used-token", "newPassword123")

      expect(result).toEqual({ error: "Invalid or expired reset token" })
    })
  })

  describe("resendVerificationEmail", () => {
    it("should resend verification email to unverified user", async () => {
      prismaMock.users.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        password_hash: "hashed",
        avatar_url: null,
        role: "admin",
        organization_id: "org-123",
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
        email_verified_at: null,
      })
      prismaMock.email_verification_tokens.findFirst.mockResolvedValue(null)
      prismaMock.email_verification_tokens.deleteMany.mockResolvedValue({ count: 0 })
      prismaMock.email_verification_tokens.create.mockResolvedValue({
        id: "token-123",
        user_id: "user-123",
        token: "new-token",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        created_at: new Date(),
      })

      const result = await resendVerificationEmail("test@example.com")

      expect(result).toEqual({
        success: true,
        message: "If an account exists, a verification email has been sent.",
      })
      expect(sendVerificationEmail).toHaveBeenCalled()
    })

    it("should not resend if token was created recently (rate limit)", async () => {
      prismaMock.users.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        password_hash: "hashed",
        avatar_url: null,
        role: "admin",
        organization_id: "org-123",
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
        email_verified_at: null,
      })
      prismaMock.email_verification_tokens.findFirst.mockResolvedValue({
        id: "token-123",
        user_id: "user-123",
        token: "recent-token",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        created_at: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      })

      const result = await resendVerificationEmail("test@example.com")

      expect(result).toEqual({
        success: true,
        message: "If an account exists, a verification email has been sent.",
      })
      expect(sendVerificationEmail).not.toHaveBeenCalled()
    })

    it("should return success message for non-existent user (security)", async () => {
      prismaMock.users.findUnique.mockResolvedValue(null)

      const result = await resendVerificationEmail("nonexistent@example.com")

      expect(result).toEqual({
        success: true,
        message: "If an account exists, a verification email has been sent.",
      })
      expect(sendVerificationEmail).not.toHaveBeenCalled()
    })
  })
})

