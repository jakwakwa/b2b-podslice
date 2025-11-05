import { z } from "zod/v4";
import prisma from "@/lib/prisma";

const WaitListSchema = z.object({
	email: z.string().email(),
	name: z.string().optional(),
});

export async function addToWaitingList(data: z.infer<typeof WaitListSchema>) {
	try {
		// Validate input
		const validatedData = WaitListSchema.parse(data);

		// Check if email already exists
		// biome-ignore lint/suspicious/noExplicitAny: Prisma Accelerate extension types are too complex for TS to infer
		const existing = await (prisma.waiting_list.findUnique as any)({
			where: { email: validatedData.email },
		});

		if (existing) {
			return { error: "This email is already on the waiting list" };
		}

		// Create waiting list entry
		await prisma.waiting_list.create({
			data: {
				email: validatedData.email,
				name: validatedData.name?.trim() || "anonymous",
				created_at: new Date(),
			},
		});

		return { success: true, message: "Successfully joined the waiting list!" };
	} catch (error) {
		console.error("[v0] Join waiting list error:", error);

		if (error instanceof z.ZodError) {
			return { error: "Invalid email address" };
		}

		return {
			error:
				"Failed to join waiting list, please try again later. Or contact support if the problem persists.",
		};
	}
}
