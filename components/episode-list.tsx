import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Episode = {
  id: string
  title: string
  description: string | null
  duration_seconds: number | null
  processing_status: string
  summary_count: number
  created_at: Date
}

export function EpisodeList({ episodes, podcastId }: { episodes: Episode[]; podcastId: string }) {
  if (episodes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No episodes yet</p>
        <Link href={`/dashboard/episodes/new?podcast=${podcastId}`}>
          <Button className="mt-4">Add Your First Episode</Button>
        </Link>
      </Card>
    )
  }

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-500",
    processing: "bg-blue-500/10 text-blue-500",
    completed: "bg-green-500/10 text-green-500",
    failed: "bg-red-500/10 text-red-500",
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return "N/A"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="space-y-4">
      {episodes.map((episode) => (
        <Link key={episode.id} href={`/dashboard/episodes/${episode.id}`}>
          <Card className="p-4 transition-colors hover:bg-muted/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{episode.title}</h3>
                {episode.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{episode.description}</p>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={statusColors[episode.processing_status as keyof typeof statusColors]}
                  >
                    {episode.processing_status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{formatDuration(episode.duration_seconds)}</span>
                  <span className="text-sm text-muted-foreground">
                    {episode.summary_count} {episode.summary_count === 1 ? "summary" : "summaries"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(episode.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
