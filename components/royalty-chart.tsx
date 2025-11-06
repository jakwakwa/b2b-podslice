"use client";
import { useState } from "react";
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
import { formatCurrency } from "@/lib/royalties";

type Royalty = {
    id: string;
    period_start: Date;
    calculated_amount: number;
    payment_status: string;
};

export function RoyaltyChart({ royalties }: { royalties: Royalty[] }) {
    const [_isHovered, setIsHovered] = useState(false);

    const _handleMouseEnter = () => {
        setIsHovered(true);
    };

    const _handleMouseLeave = () => {
        setIsHovered(false);
    };

    if (royalties.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                No data available
            </div>
        );
    }

    const chartData = royalties
        .slice(0, 12)
        .reverse()
        .map(r => ({
            id: r.id,
            month: new Date(r.period_start).toLocaleDateString("en-US", { month: "short" }),
            amount: Number(r.calculated_amount),
            paid: r.payment_status === "paid",
        }));

    return (
        <ChartContainer className="h-64 w-full">
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ left: 1, right: 12, top: 8 }}>
                    <CartesianGrid className="stroke-muted" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="month"
                        tick={{ fill: "var(--foreground)" }}
                        className="text-foreground"
                    />
                    <YAxis
                        tick={{ fill: "black" }}
                        className="text-foreground"
                        tickFormatter={v => formatCurrency(v)}
                    />
                    <Tooltip
                        cursor={{ fill: "transparent" }}
                        content={({ active, payload, label }) => {
                            if (!(active && payload) || payload.length === 0) return null;
                            const p = payload[0].payload as { paid: boolean; amount: number };
                            return (
                                <ChartTooltipContent
                                    active
                                    payload={[
                                        {
                                            name: p.paid ? "Paid" : "Pending",
                                            value: formatCurrency(p.amount),
                                            color: p.paid
                                                ? "var(--primary-foreground) hover:fill-[var(--primary-foreground)]"
                                                : "var(--primary)) hover:fill-[var(--primary)]",
                                        },
                                    ]}
                                    label={label}
                                />
                            );
                        }}
                    />
                    <Bar dataKey="amount" fill="var(--chart-4)" radius={[2, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
