# Quick Start - Testing Guide

## Install & Run Tests in 3 Steps

### Step 1: Install Dependencies

```bash
# Install all project dependencies
bun install

# Install Playwright browsers (needed for E2E tests)
bunx playwright install
```

### Step 2: Run Unit Tests

```bash
# Run all unit tests
bun test
```

Expected output:
```
✓ tests/unit/auth.test.ts (13)
  ✓ Auth Actions (13)
    ✓ signUp (2)
    ✓ signIn (2)
    ✓ verifyEmail (3)
    ✓ requestPasswordReset (2)
    ✓ resetPassword (3)
    ✓ resendVerificationEmail (3)

Test Files  1 passed (1)
Tests  13 passed (13)
```

### Step 3: Run E2E Tests

```bash
# Make sure DATABASE_URL is set in .env.local
# Then run:
bun test:e2e
```

Expected output:
```
Running 14 tests using 1 worker

✓ tests/e2e/auth.spec.ts:12:3 › Sign Up › should display sign up page correctly
✓ tests/e2e/auth.spec.ts:22:3 › Sign Up › should validate required fields
✓ tests/e2e/auth.spec.ts:34:3 › Sign Up › should validate password minimum length
✓ tests/e2e/auth.spec.ts:49:3 › Sign Up › successfully creates new account
...
14 passed (30s)
```

## Quick Commands

| Command | Description |
|---------|-------------|
| `bun test` | Run unit tests once |
| `bun test:watch` | Run unit tests in watch mode |
| `bun test:ci` | Run unit tests with coverage |
| `bun test:e2e` | Run E2E tests |
| `bun test:e2e:ui` | Run E2E tests in interactive UI mode |
| `bun test:e2e:debug` | Run E2E tests in debug mode |
| `bun test:all` | Run both unit and E2E tests |

## Troubleshooting

### "Cannot find module @playwright/test"

Run:
```bash
bun install
```

### "Executable doesn't exist"

Run:
```bash
bunx playwright install
```

### "Error validating datasource"

Make sure your `.env.local` has:
```bash
DATABASE_URL="postgresql://..."
```

The URL should start with `postgresql://` (not `prisma://`) for local development.

### "Port 3000 is already in use"

Stop any running dev servers:
```bash
pkill -f "next dev"
```

## What Gets Tested?

### ✅ Unit Tests (`tests/unit/auth.test.ts`)
- User registration
- User login
- Email verification
- Password reset
- Security features

### ✅ E2E Tests (`tests/e2e/auth.spec.ts`)
- Sign up form
- Sign in form
- Password reset form
- Navigation between pages
- Error messages
- Success states

## More Information

See `TESTING.md` for comprehensive documentation.

