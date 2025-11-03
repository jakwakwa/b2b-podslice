import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { AnalyticsChart } from "@/components/analytics-chart"
import { TopContent } from "@/components/top-content"
import { EngagementMetrics } from "@/components/engagement-metrics"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const period = params.period || "30"
  const daysAgo = Number.parseInt(period)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)

  // Overall stats
  const summaries = await prisma.summaries.findMany({
    where: {
      episodes: {
        podcasts: {
          organization_id: user.organization_id,
        },
      },
      created_at: {
        gte: startDate,
      },
    },
    include: {
      analytics_events: {
        where: {
          created_at: {
            gte: startDate,
          },
        },
      },
    },
  })

  const totalSummaries = summaries.length
  const totalViews = summaries.reduce((sum, s) => sum + (s.view_count || 0), 0)
  const totalShares = summaries.reduce((sum, s) => sum + (s.share_count || 0), 0)
  const totalEvents = summaries.reduce((sum, s) => sum + s.analytics_events.length, 0)

  const stats = {
    total_summaries: totalSummaries,
    total_views: totalViews,
    total_shares: totalShares,
    total_events: totalEvents,
  }

  // Daily analytics for chart
  const allAnalyticsEvents = await prisma.analytics_events.findMany({
    where: {
      summaries: {
        episodes: {
          podcasts: {
            organization_id: user.organization_id,
          },
        },
      },
      created_at: {
        gte: startDate,
      },
    },
    include: {
      summaries: true,
    },
  })

  // Group by date and event type
  const dailyMap = new Map<string, { views: number; shares: number; clicks: number }>()
  for (const event of allAnalyticsEvents) {
    const date = event.created_at.toISOString().split("T")[0]
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { views: 0, shares: 0, clicks: 0 })
    }
    const day = dailyMap.get(date)!
    if (event.event_type === "view") day.views++
    else if (event.event_type === "share") day.shares++
    else if (event.event_type === "click") day.clicks++
  }

  const dailyAnalytics = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }))

  // Top performing content
  const topSummaries = summaries
    .map((s) => ({
      id: s.id,
      summary_type: s.summary_type,
      content: s.content,
      view_count: s.view_count || 0,
      share_count: s.share_count || 0,
      episode_title: s.episodes?.title || "",
      podcast_title: s.episodes?.podcasts?.title || "",
    }))
    .sort((a, b) => (b.view_count + b.share_count * 10) - (a.view_count + a.share_count * 10))
    .slice(0, 10)

  // Content type breakdown
  const contentTypeMap = new Map<string, { count: number; total_views: number; total_shares: number }>()
  for (const s of summaries) {
    const type = s.summary_type
    if (!contentTypeMap.has(type)) {
      contentTypeMap.set(type, { count: 0, total_views: 0, total_shares: 0 })
    }
    const data = contentTypeMap.get(type)!
    data.count++
    data.total_views += s.view_count || 0
    data.total_shares += s.share_count || 0
  }

  const contentTypeStats = Array.from(contentTypeMap.entries())
    .map(([type, data]) => ({ summary_type: type, ...data }))
    .sort((a, b) => b.total_views - a.total_views)

  // Traffic sources
  const trafficSourceMap = new Map<string, number>()
  for (const event of allAnalyticsEvents) {
    if (event.event_type === "view") {
      const source = (event.metadata as any)?.source || "direct"
      trafficSourceMap.set(source, (trafficSourceMap.get(source) || 0) + 1)
    }
  }

  const trafficSources = Array.from(trafficSourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const engagementRate =
    stats.total_views > 0 ? ((stats.total_shares / stats.total_views) * 100).toFixed(2) : "0.00"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="mt-2 text-muted-foreground">Track performance and engagement metrics</p>
          </div>
          <Select defaultValue={period}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Views</p>
            <p className="mt-2 text-3xl font-bold">{stats.total_views.toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted-foreground">Across {stats.total_summaries} pieces</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
            <p className="mt-2 text-3xl font-bold">{stats.total_shares.toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted-foreground">{engagementRate}% engagement rate</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Events</p>
            <p className="mt-2 text-3xl font-bold">{stats.total_events.toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted-foreground">All interactions</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Avg. per Day</p>
            <p className="mt-2 text-3xl font-bold">{Math.round(stats.total_views / daysAgo).toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted-foreground">Views per day</p>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="p-6">
            <h2 className="mb-6 text-xl font-semibold">Engagement Over Time</h2>
            <AnalyticsChart data={dailyAnalytics} />
          </Card>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Top Performing Content</h2>
            <TopContent summaries={topSummaries} />
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-semibold">Performance by Type</h2>
            <EngagementMetrics contentTypes={contentTypeStats} trafficSources={trafficSources} />
          </div>
        </div>
      </main>
    </div>
  )
}
