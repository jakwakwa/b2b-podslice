import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Podcast = {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  category: string | null
  episode_count: number
}

export function PodcastGrid({ podcasts }: { podcasts: Podcast[] }) {
  if (podcasts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
        <h3 className="mt-6 text-xl font-semibold">No podcasts yet</h3>
        <p className="mt-2 text-muted-foreground">Get started by adding your first podcast</p>
        <Link href="/dashboard/podcasts/new">
          <Button className="mt-6">Add Podcast</Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {podcasts.map((podcast) => (
        <Link key={podcast.id} href={`/dashboard/podcasts/${podcast.id}`}>
          <Card className="overflow-hidden transition-all hover:shadow-lg">
            {podcast.cover_image_url ? (
              <img
                src={podcast.cover_image_url || "/placeholder.svg"}
                alt={podcast.title}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center bg-muted">
                <span className="text-6xl font-bold text-muted-foreground">{podcast.title[0]}</span>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-lg">{podcast.title}</h3>
              {podcast.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{podcast.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {podcast.episode_count} {podcast.episode_count === 1 ? "episode" : "episodes"}
                </span>
                {podcast.category && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {podcast.category}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
