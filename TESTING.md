# Testing Guide

This document provides comprehensive information about testing the Podslice B2B application.

## Test Infrastructure

The project uses two main testing frameworks:

- **Vitest** - For unit and integration tests
- **Playwright** - For end-to-end (E2E) tests

## Prerequisites

Before running tests, ensure you have:

1. All dependencies installed:
   ```bash
   bun install
   ```

2. Playwright browsers installed:
   ```bash
   bunx playwright install
   ```

3. A valid `DATABASE_URL` set in `.env.local` or `.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   ```

## Running Tests

### Unit Tests (Vitest)

Run all unit tests:
```bash
bun test
```

Run tests in watch mode:
```bash
bun test:watch
```

Run tests with coverage:
```bash
bun test:ci
```

### E2E Tests (Playwright)

Run all E2E tests:
```bash
bunx playwright test
```

Run E2E tests in UI mode (interactive):
```bash
bunx playwright test --ui
```

Run E2E tests in a specific browser:
```bash
bunx playwright test --project=chromium
```

Run a specific test file:
```bash
bunx playwright test tests/e2e/auth.spec.ts
```

View test report:
```bash
bunx playwright show-report
```

## Test Structure

### Unit Tests

Located in `tests/unit/`, these tests verify individual functions and components in isolation.

**Example: Auth Action Tests** (`tests/unit/auth.test.ts`)

Tests cover:
- `signUp()` - User registration
- `signIn()` - User authentication
- `verifyEmail()` - Email verification
- `requestPasswordReset()` - Password reset request
- `resetPassword()` - Password reset with token
- `resendVerificationEmail()` - Resend verification email

### E2E Tests

Located in `tests/e2e/`, these tests verify complete user workflows in a real browser.

**Example: Auth E2E Tests** (`tests/e2e/auth.spec.ts`)

Test suites cover:

#### Sign Up Flow
- Display sign up page correctly
- Validate required fields
- Validate password minimum length
- Successfully create new account
- Show error for existing email

#### Sign In Flow
- Display sign in page correctly
- Show error for invalid credentials
- Show error for unverified email
- Allow resending verification email

#### Password Reset Flow
- Display forgot password page correctly
- Send reset link for existing email
- Show success message for non-existent email (security)

#### Navigation
- Navigate between auth pages
- Navigate to home page from auth pages

## Manual Testing

### Sign Up Flow

1. Start the development server:
   ```bash
   bun run dev:legacy
   ```

2. Navigate to `http://localhost:3000/sign-up`

3. Fill in the form:
   - Full Name: Your name
   - Email: your-email@example.com
   - Organization Name: Your organization
   - Password: At least 8 characters

4. Click "Create Account"

5. Verify success message appears

6. Check email for verification link (if email service is configured)

### Sign In Flow

1. Navigate to `http://localhost:3000/sign-in`

2. Enter credentials from an existing, verified account

3. Click "Sign In"

4. Should redirect to `/dashboard` if credentials are valid and email is verified

5. Should show error message if:
   - Credentials are invalid
   - Email is not verified

### Password Reset Flow

1. Navigate to `http://localhost:3000/forgot-password`

2. Enter your email address

3. Click "Send Reset Link"

4. Check email for reset link (if email service is configured)

5. Click the reset link

6. Enter new password

7. Submit and verify you can sign in with new password

## Test Database

For E2E tests to work properly, you need a test database. Consider:

1. Using a separate test database:
   ```bash
   DATABASE_URL="postgresql://user:password@host:port/test_database?sslmode=require"
   ```

2. Setting up database cleanup between tests

3. Using transactions that roll back after each test

## Continuous Integration (CI)

To run tests in CI:

```bash
# Run unit tests with coverage
bun test:ci

# Run E2E tests headlessly
CI=true bunx playwright test
```

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Install Playwright browsers
        run: bunx playwright install --with-deps
      
      - name: Run unit tests
        run: bun test:ci
      
      - name: Run E2E tests
        run: CI=true bunx playwright test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## Test Coverage

View coverage report after running:
```bash
bun test:ci
```

Coverage report will be available in:
- `coverage/index.html` - HTML report
- `coverage/coverage-final.json` - JSON report

## Debugging Tests

### Unit Tests

Add `debugger` statements or use:
```bash
bun test --inspect-brk
```

### E2E Tests

Run in headed mode:
```bash
bunx playwright test --headed
```

Debug specific test:
```bash
bunx playwright test --debug tests/e2e/auth.spec.ts
```

Use Playwright Inspector:
```bash
PWDEBUG=1 bunx playwright test
```

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDeep, mockReset } from "vitest-mock-extended"

describe("Feature Name", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should do something", async () => {
    // Arrange
    const input = "test"
    
    // Act
    const result = await yourFunction(input)
    
    // Assert
    expect(result).toBe("expected")
  })
})
```

### E2E Test Template

```typescript
import { test, expect } from "@playwright/test"

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    // Navigate
    await page.goto("/your-page")
    
    // Interact
    await page.getByLabel("Field").fill("value")
    await page.getByRole("button", { name: "Submit" }).click()
    
    // Assert
    await expect(page.getByText("Success")).toBeVisible()
  })
})
```

## Troubleshooting

### "Cannot find module" errors

Run:
```bash
bunx prisma generate --no-engine
```

### E2E tests failing to start server

1. Check that port 3000 is available
2. Ensure no other dev server is running
3. Check that `DATABASE_URL` is set correctly

### Prisma connection errors

The fix in `lib/prisma.ts` conditionally applies Prisma Accelerate only when using `prisma://` or `prisma+postgres://` URLs. For local development with standard `postgresql://` URLs, Accelerate is automatically disabled.

### Tests timing out

Increase timeout in test files:
```typescript
test("slow test", async ({ page }) => {
  test.setTimeout(60000) // 60 seconds
  // ...
})
```

## Best Practices

1. **Keep tests independent** - Each test should set up and tear down its own data
2. **Use descriptive names** - Test names should clearly describe what is being tested
3. **Test user flows, not implementation** - E2E tests should focus on user interactions
4. **Mock external services** - Unit tests should mock external APIs and services
5. **Clean up after tests** - Always clean up test data to avoid pollution
6. **Use test utilities** - Create helper functions for common test operations
7. **Keep tests fast** - Unit tests should run in milliseconds, E2E tests in seconds

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://testingjavascript.com/)

