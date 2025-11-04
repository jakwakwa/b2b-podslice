import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const taxProfileSchema = z.object({
	taxIdentifier: z.string().min(3),
	taxJurisdiction: z.string().length(2),
	entityType: z.enum(["INDIVIDUAL", "BUSINESS"]),
	agreedToTaxTerms: z.boolean().refine((val) => val === true),
});

type TaxProfileRequest = z.infer<typeof taxProfileSchema>;

export async function POST(request: NextRequest) {
	try {
		const user = await requireAuth();
		if (user.role !== "admin") {
			return NextResponse.json(
				{ error: "Unauthorized. Admin access required." },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const validatedInput = taxProfileSchema.parse(body);

		// Update organization tax_form_status
		const updated = await prisma.organizations.update({
			where: { id: user.organization_id! },
			data: {
				tax_form_status: "SUBMITTED",
			},
		});

		return NextResponse.json(
			{
				success: true,
				organization: {
					id: updated.id,
					taxFormStatus: updated.tax_form_status,
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: error.errors,
				},
				{ status: 400 }
			);
		}

		if (error instanceof Error) {
			console.error("[Tax Profile]", error.message);
			return NextResponse.json(
				{ error: error.message || "Failed to save tax profile" },
				{ status: 500 }
			);
		}

		console.error("[Tax Profile]", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
