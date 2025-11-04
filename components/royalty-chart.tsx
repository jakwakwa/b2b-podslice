"use client"
import { formatCurrency } from "@/lib/royalties"
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

type Royalty = {
  id: string
  period_start: Date
  calculated_amount: number
  payment_status: string
}

export function RoyaltyChart({ royalties }: { royalties: Royalty[] }) {
  if (royalties.length === 0) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">No data available</div>
  }

  const chartData = royalties
    .slice(0, 12)
    .reverse()
    .map((r) => ({
      id: r.id,
      month: new Date(r.period_start).toLocaleDateString("en-US", { month: "short" }),
      amount: Number(r.calculated_amount),
      paid: r.payment_status === "paid",
    }))

  return (
    <ChartContainer className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ left: 12, right: 12, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => formatCurrency(v)} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null
              const p = payload[0].payload as any
              return (
                <ChartTooltipContent
                  active
                  payload={[
                    { name: p.paid ? "Paid" : "Pending", value: formatCurrency(p.amount), color: p.paid ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" },
                  ]}
                  label={label}
                />
              )
            }}
          />
          <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
