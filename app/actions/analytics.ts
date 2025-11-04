"use server"

import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

type BackfillParams = {
  organizationId: string
  from: Date
  to: Date
}

export async function backfillDailyAnalytics({ organizationId, from, to }: BackfillParams) {
  const user = await requireAuth()
  if (user.role !== "admin" || user.organization_id !== organizationId) {
    return { error: "Unauthorized" }
  }

  // Normalize date bounds to UTC day
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()))
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()))

  const events = await prisma.analytics_events.findMany({
    where: {
      created_at: { gte: start, lte: new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1) },
      summaries: { episodes: { podcasts: { organization_id: organizationId } } },
    },
    select: {
      summary_id: true,
      event_type: true,
      created_at: true,
      duration_ms: true,
    },
    orderBy: { created_at: "asc" },
  })

  const agg = new Map<string, { summary_id: string; day: Date; views: number; shares: number; clicks: number; plays: number; completes: number; listen_ms_total: number }>()
  for (const e of events) {
    const d = e.created_at ? new Date(e.created_at) : new Date()
    const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    const key = `${e.summary_id}:${day.toISOString()}`
    if (!agg.has(key)) {
      agg.set(key, { summary_id: e.summary_id, day, views: 0, shares: 0, clicks: 0, plays: 0, completes: 0, listen_ms_total: 0 })
    }
    const a = agg.get(key)!
    if (e.event_type === "view") a.views += 1
    else if (e.event_type === "share") a.shares += 1
    else if (e.event_type === "click" || e.event_type === "download") a.clicks += 1
    else if (e.event_type === "play") a.plays += 1
    else if (e.event_type === "complete") a.completes += 1
    if (e.duration_ms) a.listen_ms_total += e.duration_ms
  }

  for (const row of agg.values()) {
    const updated = await prisma.daily_analytics.upsert({
      where: { summary_id_day: { summary_id: row.summary_id, day: row.day } },
      create: {
        summary_id: row.summary_id,
        day: row.day,
        views: row.views,
        shares: row.shares,
        clicks: row.clicks,
        plays: row.plays,
        completes: row.completes,
        listen_ms_total: row.listen_ms_total,
        completion_rate: 0,
      },
      update: {
        views: { increment: row.views },
        shares: { increment: row.shares },
        clicks: { increment: row.clicks },
        plays: { increment: row.plays },
        completes: { increment: row.completes },
        listen_ms_total: { increment: row.listen_ms_total },
      },
    })
    const rate = updated.plays > 0 ? updated.completes / updated.plays : 0
    await prisma.daily_analytics.update({ where: { id: updated.id }, data: { completion_rate: rate } })
  }

  return { success: true }
}


