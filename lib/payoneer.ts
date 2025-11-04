/**
 * Payoneer Client
 * Server-side utility for interacting with Payoneer API.
 * Handles OAuth token management and payout operations.
 * 
 * Set PAYONEER_MOCK=true to use mock responses instead of live API calls.
 */

import { payoneerConfig } from "./payoneer-config";

const USE_MOCK = process.env.PAYONEER_MOCK === "true";

let tokenCache: { access_token: string; expires_at: number } | null = null;

/**
 * Get or refresh Payoneer OAuth access token
 */
async function getAccessToken(): Promise<string> {
	if (USE_MOCK) {
		console.log("[Payoneer Mock] Using mock access token");
		return "mock_token_" + Date.now();
	}

	const now = Math.floor(Date.now() / 1000);

	// Return cached token if valid
	if (tokenCache && tokenCache.expires_at > now + 60) {
		return tokenCache.access_token;
	}

	try {
		const response = await fetch(`${payoneerConfig.baseUrl}/oauth/token`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				grant_type: "client_credentials",
				client_id: payoneerConfig.clientId,
				client_secret: payoneerConfig.clientSecret,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(
				`Failed to get Payoneer token: ${error.error_description || error.message}`
			);
		}

		const data = await response.json();
		tokenCache = {
			access_token: data.access_token,
			expires_at: now + data.expires_in,
		};

		return data.access_token;
	} catch (error) {
		console.error("[Payoneer] Token fetch failed:", error);
		throw error;
	}
}

/**
 * Payee input for onboarding
 */
export interface PayeeInput {
	legalName: string;
	entityType: "INDIVIDUAL" | "BUSINESS";
	email: string;
	phoneNumber: string;
	country: string;
	addressLine1: string;
	addressLine2?: string;
	city: string;
	state?: string;
	postalCode: string;
	accountHolderName: string;
	bankAccountNumber: string;
	bankRoutingNumber?: string;
	bankCode?: string;
	businessName?: string;
	businessRegistrationNumber?: string;
}

/**
 * Create or update a payee
 */
export async function createPayee(input: PayeeInput): Promise<string> {
	if (USE_MOCK) {
		console.log("[Payoneer Mock] Creating mock payee for", input.legalName);
		// Generate a realistic mock payee ID
		const mockPayeeId = `payee_${Math.random().toString(36).substring(2, 15)}`;
		console.log("[Payoneer Mock] Mock payee ID:", mockPayeeId);
		return mockPayeeId;
	}

	const token = await getAccessToken();

	try {
		const payload = {
			program_id: payoneerConfig.programId,
			legal_name: input.legalName,
			entity_type: input.entityType,
			email: input.email,
			phone_number: input.phoneNumber,
			country: input.country,
			address_line_1: input.addressLine1,
			address_line_2: input.addressLine2 || undefined,
			city: input.city,
			state: input.state || undefined,
			postal_code: input.postalCode,
			account_holder_name: input.accountHolderName,
			bank_account_number: input.bankAccountNumber,
			bank_routing_number: input.bankRoutingNumber || undefined,
			bank_code: input.bankCode || undefined,
			business_name: input.businessName || undefined,
			business_registration_number: input.businessRegistrationNumber || undefined,
		};

		const response = await fetch(`${payoneerConfig.baseUrl}/api/payees`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(
				`Failed to create payee: ${error.message || JSON.stringify(error)}`
			);
		}

		const data = await response.json();
		return data.payee_id;
	} catch (error) {
		console.error("[Payoneer] Create payee failed:", error);
		throw error;
	}
}

/**
 * Get payee status
 */
export interface PayeeStatus {
	payeeId: string;
	status: "active" | "pending" | "suspended" | "failed";
	verificationStatus: "verified" | "pending" | "failed";
	createdAt: string;
}

export async function getPayeeStatus(payeeId: string): Promise<PayeeStatus> {
	if (USE_MOCK) {
		console.log("[Payoneer Mock] Fetching mock payee status for", payeeId);
		return {
			payeeId,
			status: "active",
			verificationStatus: "verified",
			createdAt: new Date().toISOString(),
		};
	}

	const token = await getAccessToken();

	try {
		const response = await fetch(
			`${payoneerConfig.baseUrl}/api/payees/${payeeId}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(
				`Failed to get payee status: ${error.message || JSON.stringify(error)}`
			);
		}

		const data = await response.json();
		return {
			payeeId: data.payee_id,
			status: data.status,
			verificationStatus: data.verification_status,
			createdAt: data.created_at,
		};
	} catch (error) {
		console.error("[Payoneer] Get payee status failed:", error);
		throw error;
	}
}

/**
 * Payout input
 */
export interface PayoutInput {
	payeeId: string;
	amount: number;
	currency: string;
	reference: string;
	description?: string;
}

/**
 * Payout response
 */
export interface PayoutResponse {
	transactionId: string;
	status: "pending" | "processing" | "completed" | "failed";
	amount: number;
	currency: string;
	createdAt: string;
}

/**
 * Create a payout
 */
export async function createPayout(input: PayoutInput): Promise<PayoutResponse> {
	if (USE_MOCK) {
		console.log("[Payoneer Mock] Processing mock payout", {
			payeeId: input.payeeId,
			amount: input.amount,
			reference: input.reference,
		});
		// Generate a realistic mock transaction ID
		const mockTransactionId = `txn_${Math.random().toString(36).substring(2, 15)}`;
		console.log("[Payoneer Mock] Mock transaction ID:", mockTransactionId);
		return {
			transactionId: mockTransactionId,
			status: "completed",
			amount: input.amount,
			currency: input.currency,
			createdAt: new Date().toISOString(),
		};
	}

	const token = await getAccessToken();

	try {
		const payload = {
			payee_id: input.payeeId,
			amount: input.amount,
			currency: input.currency,
			reference: input.reference,
			description: input.description || "Royalty payout",
		};

		const response = await fetch(`${payoneerConfig.baseUrl}/api/payouts`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(
				`Failed to create payout: ${error.message || JSON.stringify(error)}`
			);
		}

		const data = await response.json();
		return {
			transactionId: data.transaction_id,
			status: data.status,
			amount: data.amount,
			currency: data.currency,
			createdAt: data.created_at,
		};
	} catch (error) {
		console.error("[Payoneer] Create payout failed:", error);
		throw error;
	}
}
