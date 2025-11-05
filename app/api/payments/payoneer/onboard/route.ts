import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createPayee } from "@/lib/payoneer";
import prisma from "@/lib/prisma";

const onboardingSchema = z.object({
	legalName: z.string().min(2, "Legal name required"),
	entityType: z.enum(["INDIVIDUAL", "BUSINESS"]),
	email: z.string().email(),
	phoneNumber: z.string().min(10, "Valid phone number required"),
	country: z.string().length(2, "Use ISO country code"),
	addressLine1: z.string().min(5),
	addressLine2: z.string().optional(),
	city: z.string().min(2),
	state: z.string().optional(),
	postalCode: z.string().min(3),
	accountHolderName: z.string().min(2),
	bankAccountNumber: z.string().min(5),
	bankRoutingNumber: z.string().optional(),
	bankCode: z.string().optional(),
	businessName: z.string().optional(),
	businessRegistrationNumber: z.string().optional(),
});

export async function POST(request: NextRequest) {
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
		});

		if (!org) {
			return NextResponse.json({ error: "Organization not found" }, { status: 404 });
		}

		if (org.payoneer_payee_id) {
			return NextResponse.json(
				{ error: "Payoneer account already configured for this organization" },
				{ status: 400 }
			);
		}

		// Parse and validate request
		const body = await request.json();
		const validatedInput = onboardingSchema.parse(body);

		// Call Payoneer API to create payee
		const payeeId = await createPayee({
			legalName: validatedInput.legalName,
			entityType: validatedInput.entityType,
			email: validatedInput.email,
			phoneNumber: validatedInput.phoneNumber,
			country: validatedInput.country,
			addressLine1: validatedInput.addressLine1,
			addressLine2: validatedInput.addressLine2,
			city: validatedInput.city,
			state: validatedInput.state,
			postalCode: validatedInput.postalCode,
			accountHolderName: validatedInput.accountHolderName,
			bankAccountNumber: validatedInput.bankAccountNumber,
			bankRoutingNumber: validatedInput.bankRoutingNumber,
			bankCode: validatedInput.bankCode,
			businessName: validatedInput.businessName,
			businessRegistrationNumber: validatedInput.businessRegistrationNumber,
		});

		// Update organization with payee ID and status
		const updated = await prisma.organizations.update({
			where: { id: org.id },
			data: {
				payoneer_payee_id: payeeId,
				payout_status: "ACTIVE",
			},
		});

		return NextResponse.json(
			{
				success: true,
				payeeId,
				organization: {
					id: updated.id,
					name: updated.name,
					payoneerPayeeId: updated.payoneer_payee_id,
					payoutStatus: updated.payout_status,
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: error.message,
				},
				{ status: 400 }
			);
		}

		if (error instanceof Error) {
			console.error("[Payoneer Onboard]", error.message);
			return NextResponse.json(
				{ error: error.message || "Payoneer onboarding failed" },
				{ status: 500 }
			);
		}

		console.error("[Payoneer Onboard]", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
