import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { PrismaClient } from "@/app/generated/prisma/client";
import { NextRequest } from "next/server";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
	default: mockDeep<PrismaClient>(),
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
	requireAuth: vi.fn(),
}));

// Mock Vercel Blob handleUpload
const mockHandleUpload = vi.fn();
vi.mock("@vercel/blob/client", () => ({
	handleUpload: mockHandleUpload,
}));

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const prismaMock = prisma as ReturnType<typeof mockDeep<PrismaClient>>;
const requireAuthMock = requireAuth as ReturnType<typeof vi.fn>;

// Import POST after mocks are set up
let POST: typeof import("@/app/api/uploads/episodes/route").POST;

describe("POST /api/uploads/episodes", () => {
	beforeAll(async () => {
		const module = await import("@/app/api/uploads/episodes/route");
		POST = module.POST;
	});

	beforeEach(() => {
		vi.clearAllMocks();
		mockHandleUpload.mockClear();

		// Default auth mock
		requireAuthMock.mockResolvedValue({
			id: "user-123",
			email: "test@example.com",
			organization_id: "org-123",
			role: "admin",
		});
	});

	it("should generate a client token for valid podcast access", async () => {
		const podcastId = "podcast-123";

		// Mock Prisma response
		prismaMock.podcasts.findUnique = vi.fn().mockResolvedValue({
			id: podcastId,
			organization_id: "org-123",
		});

		// Mock handleUpload to return a token response
		mockHandleUpload.mockResolvedValue(
			new Response(JSON.stringify({ clientToken: "test-token-123" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			})
		);

		// Create a mock request with JSON body for token generation
		const requestBody = {
			type: "blob.generate-client-token",
			payload: {
				pathname: "episodes/test.mp3",
				clientPayload: podcastId,
				multipart: true,
			},
		};

		const request = new NextRequest("http://localhost:3000/api/uploads/episodes", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		const response = await POST(request);

		// Verify handleUpload was called with correct parameters
		expect(mockHandleUpload).toHaveBeenCalledTimes(1);
		const callArgs = mockHandleUpload.mock.calls[0][0];

		expect(callArgs.body.type).toBe("blob.generate-client-token");
		expect(callArgs.body.payload.clientPayload).toBe(podcastId);
		expect(callArgs.body.payload.multipart).toBe(true);

		// Verify onBeforeGenerateToken callback exists
		expect(callArgs.onBeforeGenerateToken).toBeDefined();

		// Test the callback
		const tokenConfig = await callArgs.onBeforeGenerateToken(
			"episodes/test.mp3",
			podcastId,
			true
		);

		expect(tokenConfig.maximumSizeInBytes).toBe(5 * 1024 * 1024 * 1024);
		expect(tokenConfig.allowedContentTypes).toContain("audio/mpeg");
		expect(tokenConfig.tokenPayload).toBe(podcastId);
	});

	it("should reject unauthorized podcast access", async () => {
		const podcastId = "podcast-123";

		// Mock Prisma response - podcast belongs to different org
		prismaMock.podcasts.findUnique = vi.fn().mockResolvedValue({
			id: podcastId,
			organization_id: "different-org-456",
		});

		const requestBody = {
			type: "blob.generate-client-token",
			payload: {
				pathname: "episodes/test.mp3",
				clientPayload: podcastId,
				multipart: true,
			},
		};

		const request = new NextRequest("http://localhost:3000/api/uploads/episodes", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		// Mock handleUpload to call the callback and throw error
		mockHandleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => {
			try {
				await onBeforeGenerateToken("episodes/test.mp3", podcastId, true);
				return new Response(JSON.stringify({ clientToken: "token" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			} catch (error) {
				throw error;
			}
		});

		const response = await POST(request);
		expect(response.status).toBe(500);
		const responseData = await response.json();
		expect(responseData.error).toBe("Unauthorized");
	});

	it("should reject request with missing podcastId", async () => {
		const requestBody = {
			type: "blob.generate-client-token",
			payload: {
				pathname: "episodes/test.mp3",
				clientPayload: null,
				multipart: true,
			},
		};

		const request = new NextRequest("http://localhost:3000/api/uploads/episodes", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		mockHandleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => {
			try {
				await onBeforeGenerateToken("episodes/test.mp3", null, true);
				return new Response(JSON.stringify({ clientToken: "token" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			} catch (error) {
				throw error;
			}
		});

		const response = await POST(request);
		expect(response.status).toBe(500);
		const responseData = await response.json();
		expect(responseData.error).toBe("Missing podcastId");
	});

	it("should handle invalid JSON body gracefully", async () => {
		const request = new NextRequest("http://localhost:3000/api/uploads/episodes", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: "invalid json{",
		});

		const response = await POST(request);
		expect(response.status).toBe(400);

		const responseData = await response.json();
		expect(responseData.error).toBe("Invalid request body");
	});

	it("should handle multipart upload completion event", async () => {
		// Mock handleUpload to return upload completed response
		mockHandleUpload.mockResolvedValue(
			new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			})
		);

		// Create request with multipart content-type (not JSON)
		const request = new NextRequest("http://localhost:3000/api/uploads/episodes", {
			method: "POST",
			headers: {
				"Content-Type": "multipart/form-data; boundary=----WebKitFormBoundary",
			},
			body: "------WebKitFormBoundary\r\nContent-Disposition: form-data\r\n\r\ndata\r\n------WebKitFormBoundary--",
		});

		const response = await POST(request);

		// Verify handleUpload was called
		expect(mockHandleUpload).toHaveBeenCalledTimes(1);
		const callArgs = mockHandleUpload.mock.calls[0][0];

		// Should have minimal body structure for multipart
		expect(callArgs.body.type).toBe("blob.upload-completed");
	});

	it("should preserve request stream when cloning for JSON parsing", async () => {
		const podcastId = "podcast-123";

		prismaMock.podcasts.findUnique = vi.fn().mockResolvedValue({
			id: podcastId,
			organization_id: "org-123",
		});

		mockHandleUpload.mockResolvedValue(
			new Response(JSON.stringify({ clientToken: "test-token" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			})
		);

		const requestBody = {
			type: "blob.generate-client-token",
			payload: {
				pathname: "episodes/test.mp3",
				clientPayload: podcastId,
				multipart: true,
			},
		};

		const request = new NextRequest("http://localhost:3000/api/uploads/episodes", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		await POST(request);

		// Verify the original request object was passed to handleUpload
		// (not the cloned one, ensuring the stream is preserved)
		const callArgs = mockHandleUpload.mock.calls[0][0];
		expect(callArgs.request).toBeInstanceOf(Request);
		// The request should still be readable (not consumed)
		expect(callArgs.request.body).not.toBeNull();
	});
});
