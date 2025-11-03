"use client"
import { formatCurrency } from "@/lib/royalties"

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

  const maxAmount = Math.max(...royalties.map((r) => Number(r.calculated_amount)))
  const chartData = royalties.slice(0, 12).reverse()

  return (
    <div className="space-y-4">
      <div className="flex h-64 items-end gap-2">
        {chartData.map((royalty, index) => {
          const height = maxAmount > 0 ? (Number(royalty.calculated_amount) / maxAmount) * 100 : 0
          const isPaid = royalty.payment_status === "paid"

          return (
            <div key={royalty.id} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative w-full">
                <div
                  className={`w-full rounded-t transition-all ${isPaid ? "bg-primary" : "bg-muted"}`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={formatCurrency(Number(royalty.calculated_amount))}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(royalty.period_start).toLocaleDateString("en-US", { month: "short" })}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-primary" />
          <span className="text-muted-foreground">Paid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-muted" />
          <span className="text-muted-foreground">Pending</span>
        </div>
      </div>
    </div>
  )
}
