import type { NextRequest } from "next/server"
import { sql } from "@/lib/db"

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
    await sql`
      INSERT INTO analytics_events (
        summary_id,
        event_type,
        metadata,
        ip_address,
        user_agent,
        referrer
      )
      VALUES (
        ${summaryId},
        ${eventType},
        ${JSON.stringify(metadata || {})},
        ${ip},
        ${userAgent},
        ${referrer}
      )
    `

    // Update summary counters
    if (eventType === "view") {
      await sql`
        UPDATE summaries 
        SET view_count = view_count + 1
        WHERE id = ${summaryId}
      `
    } else if (eventType === "share") {
      await sql`
        UPDATE summaries 
        SET share_count = share_count + 1
        WHERE id = ${summaryId}
      `
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Analytics tracking error:", error)
    return Response.json({ error: "Failed to track event" }, { status: 500 })
  }
}
