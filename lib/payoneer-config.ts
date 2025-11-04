/**
 * Payoneer Configuration
 * Server-side only. Never expose these values to the client.
 */

if (typeof window !== "undefined") {
	throw new Error(
		"Payoneer config should only be imported on the server side"
	);
}

function getEnvVar(key: string, fallback?: string): string {
	const value = process.env[key] || fallback;
	if (!value) {
		// Skip validation if mocking is enabled
		if (process.env.PAYONEER_MOCK === "true") {
			console.log(`[Payoneer Mock] Skipping validation for ${key}`);
			return "";
		}
		// In development, allow missing vars; in production, throw
		if (process.env.NODE_ENV === "production") {
			throw new Error(`Missing required environment variable: ${key}`);
		}
		console.warn(`[Payoneer] Missing env var: ${key}`);
		return "";
	}
	return value;
}

export const payoneerConfig = {
	baseUrl: getEnvVar("PAYONEER_BASE_URL", "https://sandbox.payoneer.com"),
	clientId: getEnvVar("PAYONEER_CLIENT_ID"),
	clientSecret: getEnvVar("PAYONEER_CLIENT_SECRET"),
	programId: getEnvVar("PAYONEER_PROGRAM_ID"),
	tokenCacheTtl: 3600, // 1 hour in seconds
};

/**
 * Validate that all required Payoneer credentials are present.
 * Call this early in the app lifecycle.
 */
export function validatePayoneerConfig(): boolean {
	const required = ["clientId", "clientSecret", "programId"];
	const missing = required.filter(
		(key) => !payoneerConfig[key as keyof typeof payoneerConfig]
	);

	if (missing.length > 0 && process.env.NODE_ENV === "production") {
		throw new Error(
			`Missing Payoneer config: ${missing.join(", ")}. Please set environment variables.`
		);
	}

	return missing.length === 0;
}
