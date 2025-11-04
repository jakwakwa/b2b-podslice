import type { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { parseUserAgent } from "@/lib/user-agent"

const EventSchema = z.object({
  summaryId: z.string(),
  eventType: z.enum(["view", "share", "click", "download", "play", "pause", "complete"]),
  metadata: z
    .object({
      session_ms: z.number().int().nonnegative().optional(),
      duration_ms: z.number().int().nonnegative().optional(),
      progress_pct: z.number().min(0).max(100).optional(),
    })
    .passthrough()
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const { summaryId, eventType, metadata } = EventSchema.parse(json)

    // Client + context info
    const headers = request.headers
    const ip = headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined
    const userAgent = headers.get("user-agent")
    const referrer = headers.get("referer") || undefined
    const { deviceType, browserName, osName } = parseUserAgent(userAgent)

    const country = headers.get("x-vercel-ip-country") || undefined
    const region = headers.get("x-vercel-ip-country-region") || undefined
    const city = headers.get("x-vercel-ip-city") || undefined

    // Persist raw event
    await prisma.analytics_events.create({
      data: {
        summary_id: summaryId,
        event_type: eventType,
        metadata: metadata || {},
        ip_address: ip,
        user_agent: userAgent || undefined,
        referrer,
        device_type: deviceType,
        browser_name: browserName,
        os_name: osName,
        country,
        region,
        city,
        duration_ms: metadata?.session_ms ?? metadata?.duration_ms,
        progress_pct: metadata?.progress_pct,
      },
    })

    // Update summary counters (legacy quick counters)
    if (eventType === "view") {
      await prisma.summaries.update({ where: { id: summaryId }, data: { view_count: { increment: 1 } } })
    } else if (eventType === "share") {
      await prisma.summaries.update({ where: { id: summaryId }, data: { share_count: { increment: 1 } } })
    }

    // Upsert daily aggregates
    const now = new Date()
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    const inc = {
      views: eventType === "view" ? 1 : 0,
      shares: eventType === "share" ? 1 : 0,
      clicks: eventType === "click" || eventType === "download" ? 1 : 0,
      plays: eventType === "play" ? 1 : 0,
      completes: eventType === "complete" ? 1 : 0,
      listen_ms_total: metadata?.session_ms ?? 0,
    }

    const updated = await prisma.daily_analytics.upsert({
      where: { summary_id_day: { summary_id: summaryId, day } },
      create: {
        summary_id: summaryId,
        day,
        views: inc.views,
        shares: inc.shares,
        clicks: inc.clicks,
        plays: inc.plays,
        completes: inc.completes,
        listen_ms_total: inc.listen_ms_total,
        completion_rate: 0,
      },
      update: {
        views: { increment: inc.views },
        shares: { increment: inc.shares },
        clicks: { increment: inc.clicks },
        plays: { increment: inc.plays },
        completes: { increment: inc.completes },
        listen_ms_total: { increment: inc.listen_ms_total },
      },
    })

    // Recompute completion rate
    const plays = updated.plays + (inc.plays === 0 ? 0 : 0) // already reflected
    const completes = updated.completes + (inc.completes === 0 ? 0 : 0)
    const rate = plays > 0 ? completes / plays : 0
    await prisma.daily_analytics.update({ where: { id: updated.id }, data: { completion_rate: rate } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Analytics tracking error:", error)
    return Response.json({ error: "Failed to track event" }, { status: 500 })
  }
}
