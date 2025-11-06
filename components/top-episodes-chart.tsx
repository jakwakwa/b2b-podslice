"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export type TopEpisodeDatum = {
    name: string;
    value: number;
};

export function TopEpisodesChart({ data }: { data: TopEpisodeDatum[] }) {
    if (data.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                No episode data
            </div>
        );
    }
    const chartData = [...data].slice(0, 10).reverse();
    return (
        <ChartContainer className="h-80 w-full">
            <ResponsiveContainer>
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 12, right: 12, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={180}
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 4, 4]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
