import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { summaryId, eventType, metadata } = body

    if (!summaryId || !eventType) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get client info
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")
    const referrer = request.headers.get("referer")

    // Insert analytics event
    await prisma.analytics_events.create({
      data: {
        summary_id: summaryId,
        event_type: eventType,
        metadata: metadata || {},
        ip_address: ip,
        user_agent: userAgent,
        referrer: referrer,
      },
    })

    // Update summary counters
    if (eventType === "view") {
      await prisma.summaries.update({
        where: { id: summaryId },
        data: { view_count: { increment: 1 } },
      })
    } else if (eventType === "share") {
      await prisma.summaries.update({
        where: { id: summaryId },
        data: { share_count: { increment: 1 } },
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Analytics tracking error:", error)
    return Response.json({ error: "Failed to track event" }, { status: 500 })
  }
}
