"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

type DailyData = {
    date: Date;
    views: number;
    shares: number;
    clicks: number;
    plays?: number;
};

export function AnalyticsChart({ data }: { data: DailyData[] }) {
    if (data.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                No data available for this period
            </div>
        );
    }

    const chartData = data.map(d => ({
        date: new Date(d.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
        views: d.views,
        shares: d.shares,
        clicks: d.clicks,
        plays: d.plays ?? 0,
    }));

    return (
        <ChartContainer
            className="h-72 w-full"
            config={{
                views: { color: "var(--chart-1)" },
                shares: { color: "var(--chart-2)" },
                clicks: { color: "var(--chart-3)" },
                plays: { color: "var(--chart-4)" },
            }}>
            <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 0 }}>
                    <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.7} />
                            <stop offset="80%" stopColor="var(--chart-1)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="1%" stopColor="var(--chart-4)" stopOpacity={0} />
                            <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.4} />
                            <stop offset="80%" stopColor="var(--chart-3)" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={1} />
                            <stop offset="80%" stopColor="var(--chart-2)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-white/15" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: "var(--color-violet-400)" }} />
                    <YAxis className="text-xs" tick={{ fill: "var(--color-cyan-500)" }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="views"
                        stroke="var(--chart-1)"
                        fill="url(#colorViews)"
                        name="Views"
                    />
                    <Area
                        type="monotone"
                        dataKey="shares"
                        stroke="var(--chart-4)"
                        fill="url(#colorShares)"
                        name="Shares"
                    />
                    <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="var(--chart-3)"
                        fill="url(#colorClicks)"
                        name="Clicks"
                    />
                    <Area
                        type="monotone"
                        dataKey="plays"
                        stroke="var(--chart-2)"
                        fill="url(#colorPlays)"
                        name="Plays"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
