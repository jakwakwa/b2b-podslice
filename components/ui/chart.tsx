"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
    string,
    {
        label?: string;
        color?: string; // CSS color or CSS var, e.g. "var(--chart-1)"
    }
>;

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
    config?: ChartConfig;
};

export function ChartContainer({
    config,
    className,
    style,
    ...props
}: ChartContainerProps) {
    const cssVars: React.CSSProperties = {};
    if (config) {
        for (const [key, value] of Object.entries(config)) {
            const varName = `--chart-${key}` as keyof React.CSSProperties;
            (cssVars as any)[varName] = value.color ?? "var(--chart-1)";
        }
    }
    return (
        <div
            className={cn("w-full", className)}
            style={{ ...cssVars, ...style }}
            {...props}
        />
    );
}

// Lightweight tooltip content used with Recharts <Tooltip content={<ChartTooltipContent />} />
export function ChartTooltipContent({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: any[];
    label?: any;
}) {
    if (!(active && payload) || payload.length === 0) return null;
    return (
        <div className="rounded-md border  px-3 py-2 text-sm shadow-sm  ">
            {label && <div className="mb-1 font-medium text-foreground">{String(label)}</div>}
            <div className="space-y-0.5">
                {payload.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-foreground/80">
                        <span
                            className="inline-block h-2 w-2 rounded"
                            style={{ background: p.color }}
                        />
                        <span className="capitalize">{p.name}:</span>
                        <span className="font-medium">{p.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
