import { redirect } from "next/navigation";
import type { PrismaClient } from "@/app/generated/prisma/client";
import { PeriodToggle } from "@/components/analytics/period-toggle";
import { AnalyticsChart } from "@/components/analytics-chart";
import { DashboardHeader } from "@/components/dashboard-header";
import { EngagementMetrics } from "@/components/engagement-metrics";
import { GrowthTrendChart } from "@/components/growth-trend-chart";
import { TopContent } from "@/components/top-content";
import { TopEpisodesChart } from "@/components/top-episodes-chart";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ period?: string }>;
}) {
    const params = await searchParams;
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in");
    }

    const period = params.period || "30";
    const daysAgo = Number.parseInt(period, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    const startDay = new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
    );

    const db = prisma as unknown as PrismaClient;

    // Overall stats
    const summaries = await db.summaries.findMany({
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
            episodes: {
                select: {
                    title: true,
                    podcasts: { select: { title: true } },
                },
            },
        },
    });

    const totalSummaries = summaries.length;
    const totalViews = summaries.reduce(
        (sum: number, s: { view_count: number | null }) => sum + (s.view_count || 0),
        0
    );
    const totalShares = summaries.reduce(
        (sum: number, s: { share_count: number | null }) => sum + (s.share_count || 0),
        0
    );
    const totalEvents = summaries.reduce(
        (sum: number, s: { analytics_events: unknown[] }) => sum + s.analytics_events.length,
        0
    );

    const stats = {
        total_summaries: totalSummaries,
        total_views: totalViews,
        total_shares: totalShares,
        total_events: totalEvents,
    };

    // Daily analytics for chart (pre-aggregated)
    const dailyRows = await db.daily_analytics.findMany({
        where: {
            day: { gte: startDay },
            summaries: {
                episodes: {
                    podcasts: { organization_id: user.organization_id },
                },
            },
        },
        include: {
            summaries: { select: { episodes: { select: { title: true } } } },
        },
        orderBy: { day: "asc" },
    });

    const dailyMap = new Map<
        string,
        { views: number; shares: number; clicks: number; plays: number }
    >();
    for (const row of dailyRows) {
        const key = row.day.toISOString().split("T")[0];
        if (!dailyMap.has(key))
            dailyMap.set(key, { views: 0, shares: 0, clicks: 0, plays: 0 });
        const agg = dailyMap.get(key)!;
        agg.views += row.views;
        agg.shares += row.shares;
        agg.clicks += row.clicks;
        agg.plays += row.plays;
    }
    const dailyAnalytics = Array.from(dailyMap.entries()).map(([date, v]) => ({
        date: new Date(date),
        ...v,
    }));

    // Top episodes by plays in period
    const episodeTotals = new Map<string, number>();
    for (const row of dailyRows) {
        const name = row.summaries?.episodes?.title || "Untitled episode";
        episodeTotals.set(name, (episodeTotals.get(name) || 0) + row.plays);
    }
    const topEpisodes = Array.from(episodeTotals.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    // Top performing content
    type SummaryForTop = {
        id: string;
        summary_type: string;
        content: string;
        view_count: number | null;
        share_count: number | null;
        episodes?: { title?: string; podcasts?: { title?: string } };
    };
    const topSummaries = summaries
        .map((s: SummaryForTop) => ({
            id: s.id,
            summary_type: s.summary_type,
            content: s.content,
            view_count: s.view_count || 0,
            share_count: s.share_count || 0,
            episode_title: s.episodes?.title || "",
            podcast_title: s.episodes?.podcasts?.title || "",
        }))
        .sort(
            (
                a: { view_count: number; share_count: number },
                b: { view_count: number; share_count: number }
            ) => b.view_count + b.share_count * 10 - (a.view_count + a.share_count * 10)
        )
        .slice(0, 10);

    // Content type breakdown
    const contentTypeMap = new Map<
        string,
        { count: number; total_views: number; total_shares: number }
    >();
    for (const s of summaries) {
        const type = s.summary_type;
        if (!contentTypeMap.has(type)) {
            contentTypeMap.set(type, { count: 0, total_views: 0, total_shares: 0 });
        }
        const data = contentTypeMap.get(type)!;
        data.count++;
        data.total_views += s.view_count || 0;
        data.total_shares += s.share_count || 0;
    }

    const contentTypeStats = Array.from(contentTypeMap.entries())
        .map(([type, data]) => ({ summary_type: type, ...data }))
        .sort((a, b) => b.total_views - a.total_views);

    // Traffic sources
    // Fetch view events for traffic source breakdown
    const allAnalyticsEvents = await db.analytics_events.findMany({
        where: {
            summaries: {
                episodes: { podcasts: { organization_id: user.organization_id } },
            },
            created_at: { gte: startDate },
        },
    });
    const trafficSourceMap = new Map<string, number>();
    for (const event of allAnalyticsEvents) {
        if (event.event_type === "view") {
            const meta = event.metadata as Record<string, unknown> | null;
            const metaSource = (meta as { [k: string]: unknown } | null)?.source;
            const source = typeof metaSource === "string" ? metaSource : "direct";
            trafficSourceMap.set(source, (trafficSourceMap.get(source) || 0) + 1);
        }
    }

    const trafficSources = Array.from(trafficSourceMap.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const engagementRate =
        stats.total_views > 0
            ? ((stats.total_shares / stats.total_views) * 100).toFixed(2)
            : "0.00";

    return (
        <div className="min-h-screen ">
            <DashboardHeader user={user} />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Analytics</h1>
                        <p className="mt-2 text-muted-foreground">
                            Track performance and engagement metrics
                        </p>
                    </div>
                    <PeriodToggle value={period} />
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                        <p className="mt-2 text-3xl font-bold">
                            {stats.total_views.toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Across {stats.total_summaries} pieces
                        </p>
                    </Card>

                    <Card className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
                        <p className="mt-2 text-3xl font-bold">
                            {stats.total_shares.toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {engagementRate}% engagement rate
                        </p>
                    </Card>

                    <Card className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                        <p className="mt-2 text-3xl font-bold">
                            {stats.total_events.toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">All interactions</p>
                    </Card>

                    <Card className="p-6">
                        <p className="text-sm font-medium text-muted-foreground">Avg. per Day</p>
                        <p className="mt-2 text-3xl font-bold">
                            {Math.round(stats.total_views / daysAgo).toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">Views per day</p>
                    </Card>
                </div>

                <div className="mt-2 gap-3 flex flex-col">
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
                        <EngagementMetrics
                            contentTypes={contentTypeStats}
                            trafficSources={trafficSources}
                        />
                    </div>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-2">
                    <div>
                        <h2 className="mb-4 text-2xl font-semibold">Top Episodes (by plays)</h2>
                        <TopEpisodesChart data={topEpisodes} />
                    </div>
                    <div>
                        <h2 className="mb-4 text-2xl font-semibold">Growth Trend</h2>
                        <GrowthTrendChart
                            data={dailyAnalytics.map(d => ({
                                date: d.date,
                                views: d.views,
                                plays: d.plays,
                            }))}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
