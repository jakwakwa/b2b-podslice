# Payoneer Integration Implementation Guide

## Overview
This document details the complete Payoneer integration for the Podslice B2B platform, enabling direct royalty payouts to content partners.

## Architecture

### 1. Database Schema Changes
**Organizations table** now includes:
- `payoneer_payee_id` (String, unique): Unique ID from Payoneer for this partner
- `payout_status` (String): One of `PENDING | ACTIVE | FAILED`
- `tax_form_status` (String): One of `NONE | PENDING | SUBMITTED`
- `content_source_id` (String, unique): Links to B2C platform's partnerOwnerId for data pipeline

**Royalties table** updated:
- Renamed `stripe_payout_id` → `payoneer_transaction_id`
- Stores transaction reference from successful Payoneer payout

### 2. Server-Side Configuration

#### `lib/payoneer-config.ts`
- Validates all required Payoneer env vars at startup
- Safe configuration with environment-based fallbacks
- Prevents client-side exposure of secrets

**Required Environment Variables:**
```
PAYONEER_BASE_URL=https://sandbox.payoneer.com (or production URL)
PAYONEER_CLIENT_ID=<your-client-id>
PAYONEER_CLIENT_SECRET=<your-client-secret>
PAYONEER_PROGRAM_ID=<your-program-id>
```

#### `lib/payoneer.ts`
Server-only utility with:
- OAuth token management (cached, 1-hour TTL)
- `createPayee(input)`: Onboard a new payee
- `getPayeeStatus(payeeId)`: Check payee verification status
- `createPayout(input)`: Initiate a royalty payout

**Key Interfaces:**
- `PayeeInput`: Comprehensive payee onboarding data
- `PayeeStatus`: Payee verification and account status
- `PayoutInput` & `PayoutResponse`: Payout transaction details

### 3. API Routes

#### `POST /api/payments/payoneer/onboard`
**Purpose:** Onboard a new partner via direct form entry
**Auth:** Admin only
**Validation:** Zod schema
**Workflow:**
1. Validate form input (legal name, bank details, country, etc.)
2. Call Payoneer API to create payee
3. Store `payoneer_payee_id` in organization
4. Set `payout_status = "ACTIVE"`
5. Return payee ID for frontend confirmation

**Response Example:**
```json
{
  "success": true,
  "payeeId": "payee_xyz123",
  "organization": {
    "id": "org_id",
    "name": "Creator Name",
    "payoneerPayeeId": "payee_xyz123",
    "payoutStatus": "ACTIVE"
  }
}
```

#### `GET /api/payments/payoneer/status`
**Purpose:** Sync payee status from Payoneer
**Auth:** Admin only
**Workflow:**
1. Fetch org's `payoneer_payee_id`
2. Query Payoneer for verification status
3. Update org's `payout_status` if different
4. Return current status

**Response Example:**
```json
{
  "status": "configured",
  "payeeId": "payee_xyz123",
  "payoutStatus": "ACTIVE",
  "verificationStatus": "verified",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### `POST /api/royalties/[id]/payout`
**Purpose:** Trigger payout for a royalty period
**Auth:** Admin only
**Guards:**
- ✓ Payoneer onboarding complete (`payoneer_payee_id` exists)
- ✓ Tax form submitted (`tax_form_status === "SUBMITTED"`)
- ✓ Payout status active (`payout_status === "ACTIVE"`)
- ✓ Royalty not already paid
- ✓ Amount > $0

**Workflow:**
1. Validate all guards
2. Update royalty status → `processing`
3. Call Payoneer `createPayout` API
4. On success: Update `payment_status = "paid"`, store `payoneer_transaction_id`
5. Return transaction details

**Response Example:**
```json
{
  "success": true,
  "royalty": {
    "id": "royalty_id",
    "status": "paid",
    "paidAt": "2024-01-20T14:22:00Z",
    "transactionId": "txn_abc123"
  },
  "payout": {
    "transactionId": "txn_abc123",
    "status": "pending",
    "amount": 150.00,
    "currency": "USD"
  }
}
```

#### `POST /api/payments/payoneer/tax-profile`
**Purpose:** Store tax information for compliance
**Auth:** Admin only
**Workflow:**
1. Validate tax ID and jurisdiction
2. Store data (Phase 1: basic capture, can expand for W9/W8-BEN)
3. Update org's `tax_form_status = "SUBMITTED"`
4. Return confirmation

### 4. Frontend Components

#### `components/payments/payoneer-onboarding-form.tsx`
React Hook Form + Zod form with fields:
- Entity type (Individual/Business)
- Legal name
- Email, phone, country
- Full address (line 1, line 2, city, state, postal)
- Bank account holder name, account number
- Bank routing number, bank code (optional)
- Business name & registration (conditional)

**Features:**
- Real-time validation
- Conditional field display (business-specific fields)
- Error handling with user-friendly messages
- Loading state during submission
- Success confirmation

#### `components/payments/tax-profile-form.tsx`
React Hook Form + Zod form with fields:
- Entity type (Individual/Business)
- Tax identifier (SSN/tax ID)
- Tax jurisdiction (country code)
- Agreement checkbox (mandatory)

**Features:**
- Compliance-focused copy
- Clear field descriptions
- Blue info banner with regulatory context
- Agreement acknowledgment before submission

#### `components/royalty-payout-button.tsx`
Client component for royalties list:
- Triggers POST to `/api/royalties/[id]/payout`
- Shows loading state during processing
- Displays transaction ID on success
- Shows error toast on failure
- Auto-refreshes page on success

### 5. UI Pages

#### `app/dashboard/settings/payouts/page.tsx`
RSC page with conditional rendering:

**Sections:**
1. **Status Cards** (always visible)
   - Payoneer account status badge
   - Tax form status badge

2. **Step 1: Onboarding** (if not onboarded)
   - Displays `PayoneerOnboardingForm`
   - Explanation text

3. **Step 2: Tax Profile** (if onboarded but no tax form)
   - Displays `TaxProfileForm`
   - Compliance messaging

4. **Success State** (if both complete)
   - "All set!" message
   - Link to royalties page
   - Green success banner

#### `app/dashboard/royalties/page.tsx`
Updated with:
- Setup reminder alert (if not ready to payout)
- `RoyaltyPayoutButton` for pending royalties (only if `canProcessPayouts`)
- Display of `payoneer_transaction_id` instead of `stripe_payout_id`
- Updated payment schedule text to reference Payoneer

#### `app/dashboard/royalties/[id]/page.tsx`
Updated detail page:
- Shows `payoneer_transaction_id` and timestamp if paid

## Data Flow

### Onboarding Flow
```
Partner Admin
    ↓
Visits: /dashboard/settings/payouts
    ↓
Fills PayoneerOnboardingForm
    ↓
POST /api/payments/payoneer/onboard
    ↓
Server validates & calls Payoneer API
    ↓
Payoneer returns payee_id
    ↓
Store in org: payoneer_payee_id, payout_status = ACTIVE
    ↓
Redirect to tax form step
    ↓
Fills TaxProfileForm
    ↓
POST /api/payments/payoneer/tax-profile
    ↓
Store: tax_form_status = SUBMITTED
    ↓
Ready to process payouts!
```

### Payout Processing Flow
```
Admin on royalties page
    ↓
Clicks "Process Payout" button
    ↓
POST /api/royalties/[id]/payout
    ↓
Server validates guards:
  - Org.payoneer_payee_id ✓
  - Org.tax_form_status === SUBMITTED ✓
  - Org.payout_status === ACTIVE ✓
  - Royalty.payment_status !== paid ✓
  - Amount > 0 ✓
    ↓
Call Payoneer createPayout()
    ↓
On success: Update royalty
  - payment_status = paid
  - paid_at = now
  - payoneer_transaction_id = txn_id
    ↓
Return success with transaction details
    ↓
Show toast: "Payout processed - TXN: txn_id"
```

## Security Considerations

### Secrets Management
- All Payoneer credentials in env vars (never committed)
- `lib/payoneer-config.ts` guards against client-side imports
- Token caching with 1-hour TTL prevents repeated OAuth calls
- Errors logged server-side, safe messages returned to client

### Authorization
- All endpoints require `requireAuth()` + admin role check
- Org isolation: Admins can only access their own organization's data
- Royalty ownership verified before processing

### Input Validation
- All user inputs validated with Zod before Payoneer API calls
- Safe error messages returned (never expose internal details)
- Guard clauses prevent invalid state transitions

## Testing Strategy

### Unit Tests (Recommended)
- Zod schema validation for onboarding/tax forms
- Payoneer client token caching logic
- Status guard logic in payout route

### Integration Tests (Recommended)
- Mock Payoneer API responses
- Full flow: onboard → tax form → payout
- Error cases: already onboarded, tax form not submitted, etc.

### Manual Testing Checklist
- [ ] Visit /dashboard/settings/payouts - shows onboarding form
- [ ] Submit onboarding with valid data - success confirmation
- [ ] After onboarding, form shows tax form step
- [ ] Submit tax form - success, redirects to success state
- [ ] Visit royalties page - shows "Process Payout" button
- [ ] Click payout button - success toast with transaction ID
- [ ] Verify royalty status changed to "paid"
- [ ] Verify payoneer_transaction_id is stored
- [ ] Test guard: try payout without onboarding - should reject
- [ ] Test guard: try payout without tax form - should reject

## Migration Notes

### For Existing Databases
Run Prisma migration:
```bash
bunx prisma migrate dev --name add_payoneer_fields_remove_stripe
```

This will:
- Add new org fields: `payoneer_payee_id`, `payout_status`, `tax_form_status`, `content_source_id`
- Rename royalties field: `stripe_payout_id` → `payoneer_transaction_id`

### Code Cleanup
All references to Stripe removed:
- ✓ Schema: `stripe_payout_id` → `payoneer_transaction_id`
- ✓ Types: Updated in `lib/db.ts`
- ✓ UI: Updated display in royalties pages
- ✓ Copy: Updated payment schedule text

## Future Enhancements (Phase 2/3)

1. **Webhook Handling**: Listen to Payoneer webhooks for payout status updates
2. **Batch Payouts**: Process multiple partners' royalties in a single batch
3. **Payout History Log**: Dedicated `PayoutLog` table for audit trail
4. **Tax Forms**: Store W9/W8-BEN forms directly in database
5. **Scheduled Jobs**: Cloud Function to auto-trigger monthly payouts
6. **Multi-Currency**: Support payouts in multiple currencies
7. **Advanced Reporting**: Dashboard for payouts, failures, reconciliation
8. **B2C-to-B2B Sync**: Connect to GCP data pipeline for automated accounting

## Support & Debugging

### Common Issues

**"Payoneer account not configured"**
- User hasn't completed onboarding form
- Direct them to `/dashboard/settings/payouts`

**"Tax form must be submitted"**
- After onboarding, user must fill tax form
- Tax form is second step on settings page

**"Payment already processed"**
- Royalty already has `payment_status = "paid"`
- Check if double-click occurred; add optimistic UI locking

**"Token fetch failed"**
- Check Payoneer credentials in env vars
- Verify network connectivity to Payoneer API
- Check API rate limits (Payoneer may throttle)

### Useful Logs
All errors logged with `[Payoneer]` or `[Tax Profile]` or `[Payout]` prefix.
Search server logs for these tags during troubleshooting.

---

**Created:** January 2024
**Last Updated:** January 2024
**Status:** Phase 1 Implementation Complete
