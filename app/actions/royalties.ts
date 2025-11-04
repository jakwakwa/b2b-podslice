"use server";

import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateRoyalty, getPayoutSchedule } from "@/lib/royalties";

export async function calculateMonthlyRoyalties(
	organizationId: string,
	year: number,
	month: number
) {
	const user = await requireAuth();

	if (user.organization_id !== organizationId || user.role !== "admin") {
		return { error: "Unauthorized" };
	}

	const { start, end } = getPayoutSchedule(new Date(year, month - 1, 1));

	try {
		// Get all summaries and their engagement for the period
		const summaries = await prisma.summaries.findMany({
			where: {
				episodes: {
					podcasts: {
						organization_id: organizationId,
					},
				},
				created_at: {
					gte: start,
					lte: end,
				},
			},
			select: {
				id: true,
				view_count: true,
				share_count: true,
			},
		});

		const totalViews = summaries.reduce((sum, s) => sum + (s.view_count || 0), 0);
		const totalShares = summaries.reduce((sum, s) => sum + (s.share_count || 0), 0);
		const calculatedAmount = calculateRoyalty(totalViews, totalShares);

		// Check if royalty record already exists
		const existing = await prisma.royalties.findFirst({
			where: {
				organization_id: organizationId,
				period_start: start,
				period_end: end,
			},
		});

		if (existing) {
			// Update existing record
			await prisma.royalties.update({
				where: { id: existing.id },
				data: {
					total_views: totalViews,
					total_shares: totalShares,
					calculated_amount: calculatedAmount,
					updated_at: new Date(),
				},
			});
		} else {
			// Create new royalty record
			const royalty = await prisma.royalties.create({
				data: {
					organization_id: organizationId,
					period_start: start,
					period_end: end,
					total_views: totalViews,
					total_shares: totalShares,
					calculated_amount: calculatedAmount,
					payment_status: "pending",
				},
			});

			// Create line items for each summary
			for (const summary of summaries) {
				const amount = calculateRoyalty(
					summary.view_count || 0,
					summary.share_count || 0
				);
				await prisma.royalty_line_items.create({
					data: {
						royalty_id: royalty.id,
						summary_id: summary.id,
						views: summary.view_count || 0,
						shares: summary.share_count || 0,
						amount: amount,
					},
				});
			}
		}

		return { success: true };
	} catch (error) {
		console.error("[v0] Calculate royalties error:", error);
		return { error: "Failed to calculate royalties" };
	}
}

export async function processPayment(royaltyId: string) {
	const user = await requireAuth();

	if (user.role !== "admin") {
		return { error: "Unauthorized" };
	}

	try {
		// Verify royalty belongs to user's organization
		const royalty = await prisma.royalties.findFirst({
			where: {
				id: royaltyId,
				organization_id: user.organization_id,
			},
		});

		if (!royalty) {
			return { error: "Royalty not found" };
		}

		if (royalty.payment_status === "paid") {
			return { error: "Payment already processed" };
		}

		// In a real implementation, this would integrate with Paddle
		// For demo purposes, we'll simulate the payment
		await prisma.royalties.update({
			where: { id: royaltyId },
			data: { payment_status: "processing" },
		});

		// Simulate Paddle payout
		const stripePayoutId = `po_${Date.now()}`;

		await prisma.royalties.update({
			where: { id: royaltyId },
			data: {
				payment_status: "paid",
				paid_at: new Date(),
				stripe_payout_id: stripePayoutId,
			},
		});

		return { success: true, payoutId: stripePayoutId };
	} catch (error) {
		console.error("[v0] Process payment error:", error);

		await prisma.royalties.update({
			where: { id: royaltyId },
			data: { payment_status: "failed" },
		});

		return { error: "Failed to process payment" };
	}
}
