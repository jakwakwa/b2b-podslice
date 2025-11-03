import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Episode = {
  id: string
  title: string
  podcast_title: string
  podcast_cover: string | null
  processing_status: string
  created_at: Date
}

export function RecentEpisodes({ episodes }: { episodes: Episode[] }) {
  if (episodes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No episodes yet</p>
      </Card>
    )
  }

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-500",
    processing: "bg-blue-500/10 text-blue-500",
    completed: "bg-green-500/10 text-green-500",
    failed: "bg-red-500/10 text-red-500",
  }

  return (
    <div className="space-y-4">
      {episodes.map((episode) => (
        <Card key={episode.id} className="p-4">
          <div className="flex items-start gap-4">
            {episode.podcast_cover ? (
              <img
                src={episode.podcast_cover || "/placeholder.svg"}
                alt={episode.podcast_title}
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                <span className="text-lg font-bold text-muted-foreground">{episode.podcast_title[0]}</span>
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-semibold">{episode.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{episode.podcast_title}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={statusColors[episode.processing_status as keyof typeof statusColors]}
                >
                  {episode.processing_status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(episode.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
