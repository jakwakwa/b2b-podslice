import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
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
  const stats = await sql`
    SELECT 
      COUNT(DISTINCT s.id) as total_summaries,
      COALESCE(SUM(s.view_count), 0) as total_views,
      COALESCE(SUM(s.share_count), 0) as total_shares,
      COUNT(DISTINCT ae.id) as total_events
    FROM summaries s
    LEFT JOIN analytics_events ae ON ae.summary_id = s.id AND ae.created_at >= ${startDate.toISOString()}
    INNER JOIN episodes e ON e.id = s.episode_id
    INNER JOIN podcasts p ON p.id = e.podcast_id
    WHERE p.organization_id = ${user.organization_id}
      AND s.created_at >= ${startDate.toISOString()}
  `

  // Daily analytics for chart
  const dailyAnalytics = await sql`
    SELECT 
      DATE(ae.created_at) as date,
      COUNT(*) FILTER (WHERE ae.event_type = 'view') as views,
      COUNT(*) FILTER (WHERE ae.event_type = 'share') as shares,
      COUNT(*) FILTER (WHERE ae.event_type = 'click') as clicks
    FROM analytics_events ae
    INNER JOIN summaries s ON s.id = ae.summary_id
    INNER JOIN episodes e ON e.id = s.episode_id
    INNER JOIN podcasts p ON p.id = e.podcast_id
    WHERE p.organization_id = ${user.organization_id}
      AND ae.created_at >= ${startDate.toISOString()}
    GROUP BY DATE(ae.created_at)
    ORDER BY date ASC
  `

  // Top performing content
  const topSummaries = await sql`
    SELECT 
      s.id,
      s.summary_type,
      s.content,
      s.view_count,
      s.share_count,
      e.title as episode_title,
      p.title as podcast_title
    FROM summaries s
    INNER JOIN episodes e ON e.id = s.episode_id
    INNER JOIN podcasts p ON p.id = e.podcast_id
    WHERE p.organization_id = ${user.organization_id}
      AND s.created_at >= ${startDate.toISOString()}
    ORDER BY (s.view_count + s.share_count * 10) DESC
    LIMIT 10
  `

  // Content type breakdown
  const contentTypeStats = await sql`
    SELECT 
      s.summary_type,
      COUNT(*) as count,
      COALESCE(SUM(s.view_count), 0) as total_views,
      COALESCE(SUM(s.share_count), 0) as total_shares
    FROM summaries s
    INNER JOIN episodes e ON e.id = s.episode_id
    INNER JOIN podcasts p ON p.id = e.podcast_id
    WHERE p.organization_id = ${user.organization_id}
      AND s.created_at >= ${startDate.toISOString()}
    GROUP BY s.summary_type
    ORDER BY total_views DESC
  `

  // Traffic sources
  const trafficSources = await sql`
    SELECT 
      COALESCE(ae.metadata->>'source', 'direct') as source,
      COUNT(*) as count
    FROM analytics_events ae
    INNER JOIN summaries s ON s.id = ae.summary_id
    INNER JOIN episodes e ON e.id = s.episode_id
    INNER JOIN podcasts p ON p.id = e.podcast_id
    WHERE p.organization_id = ${user.organization_id}
      AND ae.created_at >= ${startDate.toISOString()}
      AND ae.event_type = 'view'
    GROUP BY source
    ORDER BY count DESC
    LIMIT 5
  `

  const engagementRate =
    stats[0].total_views > 0 ? ((stats[0].total_shares / stats[0].total_views) * 100).toFixed(2) : "0.00"

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
            <p className="mt-2 text-3xl font-bold">{stats[0].total_views.toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted-foreground">Across {stats[0].total_summaries} pieces</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
            <p className="mt-2 text-3xl font-bold">{stats[0].total_shares.toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted-foreground">{engagementRate}% engagement rate</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Events</p>
            <p className="mt-2 text-3xl font-bold">{stats[0].total_events.toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted-foreground">All interactions</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Avg. per Day</p>
            <p className="mt-2 text-3xl font-bold">{Math.round(stats[0].total_views / daysAgo).toLocaleString()}</p>
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
