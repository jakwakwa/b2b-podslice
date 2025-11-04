# Mock Payoneer Setup Guide

## Overview
The Payoneer client supports a mock mode for development and testing without requiring live API credentials. This allows you to test the entire payout flow locally.

## Quick Start

### Enable Mock Mode
Add this to your `.env.local`:

```env
PAYONEER_MOCK=true
```

That's it! All Payoneer API calls will now use realistic mock responses.

### Disable Mock Mode (Use Live API)
Add to your `.env.local`:

```env
PAYONEER_MOCK=false

# Required credentials when PAYONEER_MOCK=false:
PAYONEER_BASE_URL=https://api.payoneer.com
PAYONEER_CLIENT_ID=your_client_id
PAYONEER_CLIENT_SECRET=your_client_secret
PAYONEER_PROGRAM_ID=your_program_id
```

## What Gets Mocked

When `PAYONEER_MOCK=true`, the following functions return realistic mock responses:

### 1. `getAccessToken()`
Returns: `mock_token_${timestamp}`
- Allows all subsequent API calls to proceed
- Logs: `[Payoneer Mock] Using mock access token`

### 2. `createPayee(input)`
Returns: `payee_${randomString}` (e.g., `payee_abc123def456`)
- Simulates successful payee onboarding
- Accepts all input fields as-is
- Logs: 
  - `[Payoneer Mock] Creating mock payee for {legalName}`
  - `[Payoneer Mock] Mock payee ID: {payeeId}`

**Example Response:**
```json
"payee_a1b2c3d4e5f6g7h8"
```

### 3. `getPayeeStatus(payeeId)`
Returns:
```json
{
  "payeeId": "payee_xyz",
  "status": "active",
  "verificationStatus": "verified",
  "createdAt": "2024-01-20T14:22:00.000Z"
}
```
- Always returns "active" and "verified" status
- Logs: `[Payoneer Mock] Fetching mock payee status for {payeeId}`

### 4. `createPayout(input)`
Returns:
```json
{
  "transactionId": "txn_${randomString}",
  "status": "completed",
  "amount": {input.amount},
  "currency": "{input.currency}",
  "createdAt": "2024-01-20T14:22:00.000Z"
}
```
- Always returns "completed" status
- Generates realistic transaction IDs
- Logs:
  - `[Payoneer Mock] Processing mock payout { payeeId, amount, reference }`
  - `[Payoneer Mock] Mock transaction ID: {transactionId}`

## Testing the Full Flow

### Step 1: Onboard a Partner
1. Navigate to `/dashboard/settings/payouts`
2. Fill out the Payoneer Onboarding form
3. Submit → logs show mock payee creation
4. See success: "Payoneer onboarding completed successfully!"

### Step 2: Submit Tax Profile
1. Form appears for tax information
2. Fill in any tax ID and jurisdiction
3. Submit → logs show tax status update
4. See success: "Tax profile submitted successfully. You can now process payouts."

### Step 3: Process a Royalty Payout
1. Go to `/dashboard/royalties`
2. Find a pending royalty with a status badge
3. Click "Process Payout" button
4. Watch server logs for mock payout creation
5. See success toast: "Payout processed - TXN: {transactionId}"
6. Royalty status changes to "paid" with transaction ID displayed

## Server Logs

When using mock mode, watch for these log prefixes:

```
[Payoneer Mock] Using mock access token
[Payoneer Mock] Creating mock payee for John Doe
[Payoneer Mock] Mock payee ID: payee_abc123...
[Payoneer Mock] Fetching mock payee status for payee_abc123...
[Payoneer Mock] Processing mock payout { payeeId: 'payee_...', amount: 150, reference: 'royalty-...' }
[Payoneer Mock] Mock transaction ID: txn_def456...
```

## Environment Variable Configuration

| Variable | Value | Effect |
|----------|-------|--------|
| `PAYONEER_MOCK` | `true` | Use mock responses (default for dev) |
| `PAYONEER_MOCK` | `false` | Use live Payoneer API |
| `PAYONEER_BASE_URL` | URL | Payoneer API base URL (required when mock is false) |
| `PAYONEER_CLIENT_ID` | ID | Client credentials (required when mock is false) |
| `PAYONEER_CLIENT_SECRET` | Secret | Client credentials (required when mock is false) |
| `PAYONEER_PROGRAM_ID` | ID | Program identifier (required when mock is false) |

## Switching Between Mock and Live

### Development (Use Mock)
```env
PAYONEER_MOCK=true
```

### Testing/Production (Use Live)
```env
PAYONEER_MOCK=false
PAYONEER_BASE_URL=https://api.payoneer.com
PAYONEER_CLIENT_ID=your_live_client_id
PAYONEER_CLIENT_SECRET=your_live_client_secret
PAYONEER_PROGRAM_ID=your_live_program_id
```

## Notes

- Mock mode is **completely deterministic** - same inputs always produce similar outputs
- Transaction IDs are realistic but random (useful for testing)
- Payee IDs persist in the database (useful for checking stored values)
- All API guards still work (onboarding → tax form → payout) even in mock mode
- No actual HTTP calls are made when mock is enabled
- Switching modes requires restarting the development server

## Future: Custom Mock Responses

If you need to test error scenarios or different status states, you can extend the mock logic in `lib/payoneer.ts`. For example:

```typescript
// Add environment variable to control mock response behavior
const MOCK_PAYEE_STATUS = process.env.PAYONEER_MOCK_PAYEE_STATUS || "active";

export async function getPayeeStatus(payeeId: string): Promise<PayeeStatus> {
    if (USE_MOCK) {
        return {
            payeeId,
            status: MOCK_PAYEE_STATUS as any, // "active" | "pending" | "suspended" | "failed"
            verificationStatus: "verified",
            createdAt: new Date().toISOString(),
        };
    }
    // ... rest of implementation
}
```

Then test suspended accounts: `PAYONEER_MOCK_PAYEE_STATUS=suspended`

---

**Setup Date:** January 2024
**Last Updated:** January 2024
**Status:** Ready for Development
