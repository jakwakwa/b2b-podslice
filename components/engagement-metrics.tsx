import { Card } from "@/components/ui/card"

type ContentType = {
  summary_type: string
  count: number
  total_views: number
  total_shares: number
}

type TrafficSource = {
  source: string
  count: number
}

export function EngagementMetrics({
  contentTypes,
  trafficSources,
}: {
  contentTypes: ContentType[]
  trafficSources: TrafficSource[]
}) {
  const typeLabels: Record<string, string> = {
    full: "Full Summary",
    highlight: "Highlights",
    social_twitter: "Twitter",
    social_linkedin: "LinkedIn",
    social_instagram: "Instagram",
    show_notes: "Show Notes",
  }

  const maxViews = Math.max(...contentTypes.map((ct) => ct.total_views), 1)
  const maxTraffic = Math.max(...trafficSources.map((ts) => ts.count), 1)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 font-semibold">Content Type Performance</h3>
        <div className="space-y-4">
          {contentTypes.map((type) => {
            const percentage = (type.total_views / maxViews) * 100

            return (
              <div key={type.summary_type}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{typeLabels[type.summary_type] || type.summary_type}</span>
                  <span className="text-muted-foreground">{type.total_views.toLocaleString()} views</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{type.count} pieces</span>
                  <span>{type.total_shares} shares</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 font-semibold">Traffic Sources</h3>
        <div className="space-y-4">
          {trafficSources.map((source) => {
            const percentage = (source.count / maxTraffic) * 100

            return (
              <div key={source.source}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{source.source}</span>
                  <span className="text-muted-foreground">{source.count.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
