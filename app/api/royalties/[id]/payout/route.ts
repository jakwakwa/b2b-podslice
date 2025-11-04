import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createPayout } from "@/lib/payoneer";
import prisma from "@/lib/prisma";

interface RouteParams {
	params: {
		id: string;
	};
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
	try {
		const user = await requireAuth();
		if (user.role !== "admin") {
			return NextResponse.json(
				{ error: "Unauthorized. Admin access required." },
				{ status: 403 }
			);
		}

		const royaltyId = params.id;

		// Fetch royalty and verify ownership
		const royalty = await prisma.royalties.findFirst({
			where: {
				id: royaltyId,
				organization_id: user.organization_id!,
			},
		});

		if (!royalty) {
			return NextResponse.json({ error: "Royalty not found" }, { status: 404 });
		}

		// Fetch organization
		const org = await prisma.organizations.findUnique({
			where: { id: user.organization_id! },
		});

		if (!org) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		// Guard: Check Payoneer onboarding
		if (!org.payoneer_payee_id) {
			return NextResponse.json(
				{
					error: "Payoneer account not configured. Please complete onboarding first.",
				},
				{ status: 400 }
			);
		}

		// Guard: Check tax form status
		if (org.tax_form_status !== "SUBMITTED") {
			return NextResponse.json(
				{
					error: "Tax form must be submitted before payouts can be processed.",
				},
				{ status: 400 }
			);
		}

		// Guard: Check payout status
		if (org.payout_status !== "ACTIVE") {
			return NextResponse.json(
				{
					error: `Payoneer account status: ${org.payout_status}. Cannot process payout.`,
				},
				{ status: 400 }
			);
		}

		// Guard: Check royalty hasn't already been paid
		if (royalty.payment_status === "paid") {
			return NextResponse.json(
				{ error: "This royalty has already been paid" },
				{ status: 400 }
			);
		}

		// Guard: Check royalty amount is positive
		if (!royalty.calculated_amount || Number(royalty.calculated_amount) <= 0) {
			return NextResponse.json(
				{ error: "Cannot process payout with zero or negative amount" },
				{ status: 400 }
			);
		}

		// Update to processing status
		await prisma.royalties.update({
			where: { id: royaltyId },
			data: { payment_status: "processing" },
		});

		// Call Payoneer API
		const payoutResponse = await createPayout({
			payeeId: org.payoneer_payee_id,
			amount: Number(royalty.calculated_amount),
			currency: "USD",
			reference: `royalty-${royaltyId}`,
			description: `Royalty payout for period ${royalty.period_start} to ${royalty.period_end}`,
		});

		// Update royalty with transaction ID and paid status
		const updated = await prisma.royalties.update({
			where: { id: royaltyId },
			data: {
				payment_status: "paid",
				paid_at: new Date(),
				payoneer_transaction_id: payoutResponse.transactionId,
			},
		});

		return NextResponse.json(
			{
				success: true,
				royalty: {
					id: updated.id,
					status: updated.payment_status,
					paidAt: updated.paid_at,
					transactionId: updated.payoneer_transaction_id,
				},
				payout: {
					transactionId: payoutResponse.transactionId,
					status: payoutResponse.status,
					amount: payoutResponse.amount,
					currency: payoutResponse.currency,
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		// Revert to failed status on error
		if (error instanceof Error) {
			const match = error.message.match(/royalty-([a-f0-9-]+)/);
			if (match) {
				try {
					const royaltyId = match[1];
					if (royaltyId) {
						await prisma.royalties.update({
							where: { id: royaltyId },
							data: { payment_status: "failed" },
						});
					}
				} catch (revertError) {
					console.error("[Payout Revert]", revertError);
				}
			}

			console.error("[Payout]", error.message);
			return NextResponse.json(
				{ error: error.message || "Payout failed" },
				{ status: 500 }
			);
		}

		console.error("[Payout]", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
