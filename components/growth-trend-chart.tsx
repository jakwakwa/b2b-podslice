"use client";

import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export type GrowthDatum = {
    date: Date;
    views: number;
    plays: number;
};

export function GrowthTrendChart({ data }: { data: GrowthDatum[] }) {
    if (data.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                No trend data
            </div>
        );
    }
    const chartData = data.map(d => ({
        date: new Date(d.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
        views: d.views,
        plays: d.plays,
    }));
    return (
        <ChartContainer className="h-64 w-full">
            <ResponsiveContainer>
                <LineChart data={chartData} margin={{ left: 12, right: 12, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="views"
                        stroke="var(--chart-1)"
                        dot={false}
                        name="Views"
                    />
                    <Line
                        type="monotone"
                        dataKey="plays"
                        stroke="hsl(var(--chart-4))"
                        dot={false}
                        name="Plays"
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
