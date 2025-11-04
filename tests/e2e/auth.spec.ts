import { test, expect } from "@playwright/test"
import { randomBytes } from "node:crypto"

/**
 * E2E Tests for Authentication Flows
 * 
 * These tests cover:
 * - Sign up flow
 * - Sign in flow
 * - Email verification
 * - Password reset
 * - Sign out
 */

// Generate unique test user data
const generateTestUser = () => {
  const timestamp = Date.now()
  const random = randomBytes(4).toString("hex")
  return {
    email: `test-${timestamp}-${random}@example.com`,
    password: "TestPassword123!",
    fullName: "Test User",
    organizationName: `Test Org ${timestamp}`,
  }
}

test.describe("Authentication", () => {
  test.describe("Sign Up", () => {
    test("should display sign up page correctly", async ({ page }) => {
      await page.goto("/sign-up")

      // Check page elements
      await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible()
      await expect(page.getByLabel("Full Name")).toBeVisible()
      await expect(page.getByLabel("Email")).toBeVisible()
      await expect(page.getByLabel("Organization Name")).toBeVisible()
      await expect(page.getByLabel("Password")).toBeVisible()
      await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible()
      
      // Check link to sign in
      await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible()
    })

    test("should validate required fields", async ({ page }) => {
      await page.goto("/sign-up")
      
      // Try to submit without filling fields
      await page.getByRole("button", { name: "Create Account" }).click()
      
      // HTML5 validation should prevent submission
      const fullNameInput = page.getByLabel("Full Name")
      const isValid = await fullNameInput.evaluate((el: HTMLInputElement) => el.validity.valid)
      expect(isValid).toBe(false)
    })

    test("should validate password minimum length", async ({ page }) => {
      await page.goto("/sign-up")
      
      // Fill all fields with a short password
      await page.getByLabel("Full Name").fill("Test User")
      await page.getByLabel("Email").fill("test@example.com")
      await page.getByLabel("Organization Name").fill("Test Org")
      await page.getByLabel("Password").fill("short")
      
      // Try to submit
      await page.getByRole("button", { name: "Create Account" }).click()
      
      // Check that password validation prevents submission
      const passwordInput = page.getByLabel("Password")
      const isValid = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid)
      expect(isValid).toBe(false)
    })

    test("should successfully create a new account", async ({ page }) => {
      const testUser = generateTestUser()
      
      await page.goto("/sign-up")
      
      // Fill the sign-up form
      await page.getByLabel("Full Name").fill(testUser.fullName)
      await page.getByLabel("Email").fill(testUser.email)
      await page.getByLabel("Organization Name").fill(testUser.organizationName)
      await page.getByLabel("Password").fill(testUser.password)
      
      // Submit the form
      await page.getByRole("button", { name: "Create Account" }).click()
      
      // Wait for success message
      await expect(page.getByText("Account created successfully!")).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/check your email/i)).toBeVisible()
    })

    test("should show error for existing email", async ({ page }) => {
      const testUser = generateTestUser()
      
      // First registration
      await page.goto("/sign-up")
      await page.getByLabel("Full Name").fill(testUser.fullName)
      await page.getByLabel("Email").fill(testUser.email)
      await page.getByLabel("Organization Name").fill(testUser.organizationName)
      await page.getByLabel("Password").fill(testUser.password)
      await page.getByRole("button", { name: "Create Account" }).click()
      await expect(page.getByText("Account created successfully!")).toBeVisible({ timeout: 10000 })
      
      // Try to register again with same email
      await page.goto("/sign-up")
      await page.getByLabel("Full Name").fill("Another User")
      await page.getByLabel("Email").fill(testUser.email) // Same email
      await page.getByLabel("Organization Name").fill("Another Org")
      await page.getByLabel("Password").fill("DifferentPass123!")
      await page.getByRole("button", { name: "Create Account" }).click()
      
      // Should show error
      await expect(page.getByText("User already exists")).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe("Sign In", () => {
    test("should display sign in page correctly", async ({ page }) => {
      await page.goto("/sign-in")

      // Check page elements
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
      await expect(page.getByLabel("Email")).toBeVisible()
      await expect(page.getByLabel("Password")).toBeVisible()
      await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible()
      
      // Check links
      await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible()
      await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible()
    })

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/sign-in")
      
      // Try to sign in with non-existent credentials
      await page.getByLabel("Email").fill("nonexistent@example.com")
      await page.getByLabel("Password").fill("WrongPassword123!")
      await page.getByRole("button", { name: "Sign In" }).click()
      
      // Should show error
      await expect(page.getByText("Invalid credentials")).toBeVisible({ timeout: 10000 })
    })

    test("should show error for unverified email", async ({ page }) => {
      const testUser = generateTestUser()
      
      // Create account first
      await page.goto("/sign-up")
      await page.getByLabel("Full Name").fill(testUser.fullName)
      await page.getByLabel("Email").fill(testUser.email)
      await page.getByLabel("Organization Name").fill(testUser.organizationName)
      await page.getByLabel("Password").fill(testUser.password)
      await page.getByRole("button", { name: "Create Account" }).click()
      await expect(page.getByText("Account created successfully!")).toBeVisible({ timeout: 10000 })
      
      // Try to sign in without verifying email
      await page.goto("/sign-in")
      await page.getByLabel("Email").fill(testUser.email)
      await page.getByLabel("Password").fill(testUser.password)
      await page.getByRole("button", { name: "Sign In" }).click()
      
      // Should show verification error
      await expect(page.getByText(/verify your email/i)).toBeVisible({ timeout: 10000 })
      
      // Check that resend button is visible
      await expect(page.getByRole("button", { name: /resend verification/i })).toBeVisible()
    })

    test("should allow resending verification email from sign in page", async ({ page }) => {
      const testUser = generateTestUser()
      
      // Create account
      await page.goto("/sign-up")
      await page.getByLabel("Full Name").fill(testUser.fullName)
      await page.getByLabel("Email").fill(testUser.email)
      await page.getByLabel("Organization Name").fill(testUser.organizationName)
      await page.getByLabel("Password").fill(testUser.password)
      await page.getByRole("button", { name: "Create Account" }).click()
      await expect(page.getByText("Account created successfully!")).toBeVisible({ timeout: 10000 })
      
      // Try to sign in
      await page.goto("/sign-in")
      await page.getByLabel("Email").fill(testUser.email)
      await page.getByLabel("Password").fill(testUser.password)
      await page.getByRole("button", { name: "Sign In" }).click()
      await expect(page.getByText(/verify your email/i)).toBeVisible({ timeout: 10000 })
      
      // Click resend verification
      await page.getByRole("button", { name: /resend verification/i }).click()
      
      // Should show success message
      await expect(page.getByText(/verification email has been sent/i)).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe("Password Reset", () => {
    test("should display forgot password page correctly", async ({ page }) => {
      await page.goto("/forgot-password")

      // Check page elements
      await expect(page.getByRole("heading", { name: /reset.*password/i })).toBeVisible()
      await expect(page.getByLabel("Email")).toBeVisible()
      await expect(page.getByRole("button", { name: /send.*reset/i })).toBeVisible()
      
      // Check link to sign in
      await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible()
    })

    test("should send reset link for existing email", async ({ page }) => {
      const testUser = generateTestUser()
      
      // Create account first
      await page.goto("/sign-up")
      await page.getByLabel("Full Name").fill(testUser.fullName)
      await page.getByLabel("Email").fill(testUser.email)
      await page.getByLabel("Organization Name").fill(testUser.organizationName)
      await page.getByLabel("Password").fill(testUser.password)
      await page.getByRole("button", { name: "Create Account" }).click()
      await expect(page.getByText("Account created successfully!")).toBeVisible({ timeout: 10000 })
      
      // Request password reset
      await page.goto("/forgot-password")
      await page.getByLabel("Email").fill(testUser.email)
      await page.getByRole("button", { name: /send.*reset/i }).click()
      
      // Should show success message (even for non-existent emails for security)
      await expect(page.getByText(/reset link has been sent/i)).toBeVisible({ timeout: 10000 })
    })

    test("should show success message for non-existent email (security)", async ({ page }) => {
      await page.goto("/forgot-password")
      
      // Request reset for non-existent email
      await page.getByLabel("Email").fill("nonexistent@example.com")
      await page.getByRole("button", { name: /send.*reset/i }).click()
      
      // Should still show success message to prevent email enumeration
      await expect(page.getByText(/reset link has been sent/i)).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe("Navigation", () => {
    test("should navigate between auth pages", async ({ page }) => {
      // Start at sign in
      await page.goto("/sign-in")
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
      
      // Navigate to sign up
      await page.getByRole("link", { name: "Sign up" }).click()
      await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible()
      
      // Navigate back to sign in
      await page.getByRole("link", { name: "Sign in" }).click()
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
      
      // Navigate to forgot password
      await page.getByRole("link", { name: "Forgot password?" }).click()
      await expect(page.getByRole("heading", { name: /reset.*password/i })).toBeVisible()
      
      // Navigate back to sign in
      await page.getByRole("link", { name: /sign in/i }).click()
      await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
    })

    test("should navigate to home page from auth pages", async ({ page }) => {
      await page.goto("/sign-up")
      
      // Click on logo to go home
      await page.getByRole("link", { name: /podslice/i }).first().click()
      await expect(page).toHaveURL("/")
      await expect(page.getByRole("heading", { name: /ai-powered content/i })).toBeVisible()
    })
  })
})

