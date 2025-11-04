"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

type DailyData = {
  date: Date
  views: number
  shares: number
  clicks: number
  plays?: number
}

export function AnalyticsChart({ data }: { data: DailyData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">No data available for this period</div>
    )
  }

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    views: d.views,
    shares: d.shares,
    clicks: d.clicks,
    plays: d.plays ?? 0,
  }))

  return (
    <ChartContainer
      className="h-72 w-full"
      config={{ views: { color: "hsl(var(--chart-1))" }, shares: { color: "hsl(var(--chart-2))" }, clicks: { color: "hsl(var(--chart-3))" }, plays: { color: "hsl(var(--chart-4))" } }}
    >
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 8 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend />
          <Area type="monotone" dataKey="views" stroke="hsl(var(--chart-1))" fill="url(#colorViews)" name="Views" />
          <Area type="monotone" dataKey="shares" stroke="hsl(var(--chart-2))" fill="url(#colorShares)" name="Shares" />
          <Area type="monotone" dataKey="clicks" stroke="hsl(var(--chart-3))" fill="url(#colorClicks)" name="Clicks" />
          <Area type="monotone" dataKey="plays" stroke="hsl(var(--chart-4))" fill="url(#colorPlays)" name="Plays" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
