import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPayeeStatus } from "@/lib/payoneer";
import prisma from "@/lib/prisma";

export async function GET(_request: NextRequest) {
	try {
		const user = await requireAuth();
		if (user.role !== "admin") {
			return NextResponse.json(
				{ error: "Unauthorized. Admin access required." },
				{ status: 403 }
			);
		}

		// Get organization
		const org = await prisma.organizations.findUnique({
			where: { id: user.organization_id! },
			select: {
				id: true,
				payoneer_payee_id: true,
				payout_status: true,
			},
		});

		if (!org) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		if (!org.payoneer_payee_id) {
			return NextResponse.json(
				{
					status: "not_configured",
					message: "Payoneer account not yet configured",
				},
				{ status: 200 }
			);
		}

		// Fetch status from Payoneer
		const payeeStatus = await getPayeeStatus(org.payoneer_payee_id);

		// Map Payoneer status to internal status
		const internalStatus = (() => {
			switch (payeeStatus.status) {
				case "active":
					return "ACTIVE";
				case "pending":
					return "PENDING";
				case "suspended":
					return "FAILED";
				case "failed":
					return "FAILED";
				default:
					return "PENDING";
			}
		})();

		// Sync payout_status if different
		if (org.payout_status !== internalStatus) {
			await prisma.organizations.update({
				where: { id: org.id },
				data: { payout_status: internalStatus },
			});
		}

		return NextResponse.json(
			{
				status: "configured",
				payeeId: payeeStatus.payeeId,
				payoutStatus: internalStatus,
				verificationStatus: payeeStatus.verificationStatus,
				createdAt: payeeStatus.createdAt,
			},
			{ status: 200 }
		);
	} catch (error) {
		if (error instanceof Error) {
			console.error("[Payoneer Status]", error.message);
			return NextResponse.json(
				{ error: error.message || "Failed to fetch status" },
				{ status: 500 }
			);
		}

		console.error("[Payoneer Status]", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
