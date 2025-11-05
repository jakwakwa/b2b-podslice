"use server"

import { z } from "zod/v4"
import prisma from "@/lib/prisma"

const WaitListSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
})

export async function joinWaitingList(data: z.infer<typeof WaitListSchema>) {
  try {
    // Validate input
    const validatedData = WaitListSchema.parse(data)

    // Check if email already exists
    const existing = await prisma.waiting_list.findUnique({
      where: { email: validatedData.email },
    })

    if (existing) {
      return { error: "This email is already on the waiting list" }
    }

    // Create waiting list entry
    await prisma.waiting_list.create({
      data: {
        email: validatedData.email,
        name: validatedData.name?.trim() || "anonymous",
        created_at: new Date(),
      },
    })

    return { success: true, message: "Successfully joined the waiting list!" }
  } catch (error) {
    console.error("[v0] Join waiting list error:", error)
    
    if (error instanceof z.ZodError) {
      return { error: "Invalid email address" }
    }

    return {
      error:
        "Failed to join waiting list, please try again later. Or contact support if the problem persists.",
    }
  }
}

