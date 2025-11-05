import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function verifyPodcastAccess(podcastId: string, organizationId: string) {
	// Type assertion needed due to Prisma Accelerate extension creating complex union types
	// that TypeScript struggles to infer correctly
	// Use type assertion to work around Prisma Accelerate type inference issues
	const podcast = await (
		prisma.podcasts.findUnique as (args: {
			where: { id: string };
		}) => Promise<{ organization_id: string } | null>
	)({
		where: { id: podcastId },
	});
	return podcast?.organization_id === organizationId;
}

export async function POST(request: NextRequest) {
	const user = await requireAuth();

	// Check content-type to determine if this is a token generation (JSON) or upload completion (multipart)
	const contentType = request.headers.get("content-type") || "";
	const isJsonRequest = contentType.includes("application/json");

	let body: HandleUploadBody;
	if (isJsonRequest) {
		// For token generation requests, parse JSON from a cloned request
		// to preserve the original request stream for handleUpload
		const clonedRequest = request.clone();
		try {
			const parsed = (await clonedRequest.json()) as HandleUploadBody;
			body = parsed;
		} catch (error) {
			console.error("[v0] Failed to parse JSON body:", error);
			return new Response(JSON.stringify({ error: "Invalid request body" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}
	} else {
		// For multipart upload completion, create minimal body structure
		// handleUpload will read the actual body from the request stream
		body = {
			type: "blob.upload-completed",
			payload: {
				blob: {} as never, // Will be populated by handleUpload from request stream
			},
		} as HandleUploadBody;
	}

	// Get the Blob read-write token from environment
	// Strip quotes if present (Next.js sometimes includes them)
	let blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
	if (blobToken && (blobToken.startsWith('"') || blobToken.startsWith("'"))) {
		blobToken = blobToken.slice(1, -1);
	}

	if (!blobToken) {
		console.error("[v0] BLOB_READ_WRITE_TOKEN is not set");
		return new Response(
			JSON.stringify({ error: "Server configuration error: Blob token not found" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}

	// Validate token format
	if (!blobToken.startsWith("vercel_blob_rw_")) {
		console.error("[v0] Invalid BLOB_READ_WRITE_TOKEN format");
		return new Response(
			JSON.stringify({ error: "Server configuration error: Invalid Blob token format" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}

	try {
		const result = await handleUpload({
			token: blobToken, // Explicitly pass the token
			request, // Original request with intact body stream
			body, // Parsed body for type checking (or minimal structure for multipart)
			onBeforeGenerateToken: async (_pathname: string, clientPayload: string | null) => {
				// clientPayload should contain the podcastId
				const podcastId = clientPayload;
				if (!podcastId) throw new Error("Missing podcastId");

				const hasAccess = await verifyPodcastAccess(podcastId, user.organization_id);
				if (!hasAccess) throw new Error("Unauthorized");

				return {
					maximumSizeInBytes: 5 * 1024 * 1024 * 1024, // 5 GB
					allowedContentTypes: [
						"audio/mpeg",
						"audio/wav",
						"audio/mp4",
						"audio/aac",
						"audio/ogg",
						"audio/webm",
					],
					tokenPayload: podcastId,
				};
			},
			// Optional: we're finalizing in a Server Action, so just no-op here
			onUploadCompleted: async () => {},
		});

		// handleUpload returns an object, not a Response - convert it
		if (result.type === "blob.generate-client-token") {
			return new Response(JSON.stringify({ clientToken: result.clientToken }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Upload completed response
		return new Response(JSON.stringify({ response: "ok" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("[v0] handleUpload error:", error);
		const errorMessage = error instanceof Error ? error.message : "Upload failed";
		console.error("[v0] Error details:", {
			message: errorMessage,
			stack: error instanceof Error ? error.stack : undefined,
		});
		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
