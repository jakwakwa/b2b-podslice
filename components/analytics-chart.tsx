"use client"

type DailyData = {
  date: Date
  views: number
  shares: number
  clicks: number
}

export function AnalyticsChart({ data }: { data: DailyData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        No data available for this period
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.views, d.shares * 10, d.clicks * 5)))

  return (
    <div className="space-y-4">
      <div className="flex h-64 items-end gap-1">
        {data.map((day, index) => {
          const viewHeight = maxValue > 0 ? (day.views / maxValue) * 100 : 0
          const shareHeight = maxValue > 0 ? ((day.shares * 10) / maxValue) * 100 : 0
          const clickHeight = maxValue > 0 ? ((day.clicks * 5) / maxValue) * 100 : 0

          return (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex w-full flex-col items-center gap-0.5">
                <div
                  className="w-full rounded-t bg-blue-500"
                  style={{ height: `${Math.max(viewHeight, 2)}%` }}
                  title={`${day.views} views`}
                />
                <div
                  className="w-full bg-green-500"
                  style={{ height: `${Math.max(shareHeight, 2)}%` }}
                  title={`${day.shares} shares`}
                />
                <div
                  className="w-full bg-purple-500"
                  style={{ height: `${Math.max(clickHeight, 2)}%` }}
                  title={`${day.clicks} clicks`}
                />
              </div>
              {index % Math.ceil(data.length / 7) === 0 && (
                <span className="text-xs text-muted-foreground">
                  {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-500" />
          <span className="text-muted-foreground">Views</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Shares</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-purple-500" />
          <span className="text-muted-foreground">Clicks</span>
        </div>
      </div>
    </div>
  )
}
