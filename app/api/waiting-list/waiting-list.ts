import { z } from "zod/v4";
import prisma from "@/lib/prisma";

const _WaitListSchema = z.object({
	name: z.string().min(3).optional().default("Anonymous"),
	email: z.string().email(),
	createdAt: z.date().default(() => new Date()), // Use default factory function for Date
});

// Store email in waiting list
export async function joinWaitingList(email: string, name: string) {
	try {
        const waitingList = await prisma.waitingList.create({
            data: {
                email,
                createdAt: new Date(),
                name,
            },
        });
        return waitingList;
    }
}
