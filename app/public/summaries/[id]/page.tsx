import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { SummaryWithAttribution } from "@/components/summary-with-attribution"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function PublicSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Check if summary is from an organization with B2C license
  const summaries = await sql`
    SELECT s.*, e.title as episode_title, e.audio_url, 
           p.title as podcast_title, p.website_url,
           o.name as creator_name, o.website as creator_website,
           l.license_type
    FROM summaries s
    INNER JOIN episodes e ON e.id = s.episode_id
    INNER JOIN podcasts p ON p.id = e.podcast_id
    INNER JOIN organizations o ON o.id = p.organization_id
    INNER JOIN licenses l ON l.organization_id = o.id AND l.is_active = true
    WHERE s.id = ${id} AND l.license_type = 'b2b_b2c'
    LIMIT 1
  `

  if (summaries.length === 0) {
    notFound()
  }

  const summary = summaries[0]

  // Track view
  await sql`
    INSERT INTO analytics_events (summary_id, event_type, metadata)
    VALUES (${id}, 'view', '{"source": "public"}')
  `

  await sql`
    UPDATE summaries 
    SET view_count = view_count + 1
    WHERE id = ${id}
  `

  const typeLabels: Record<string, string> = {
    full: "Full Summary",
    highlight: "Highlights",
    social_twitter: "Twitter Post",
    social_linkedin: "LinkedIn Post",
    social_instagram: "Instagram Caption",
    show_notes: "Show Notes",
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              P
            </div>
            <span className="text-xl font-bold">Podslice</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              {typeLabels[summary.summary_type] || summary.summary_type}
            </Badge>
            <h1 className="text-4xl font-bold">{summary.episode_title}</h1>
            <p className="mt-2 text-xl text-muted-foreground">{summary.podcast_title}</p>
          </div>

          <SummaryWithAttribution
            content={summary.content}
            attribution={{
              podcastTitle: summary.podcast_title,
              episodeTitle: summary.episode_title,
              episodeUrl: summary.audio_url,
              creatorName: summary.creator_name,
              creatorWebsite: summary.creator_website,
              generatedAt: new Date(summary.created_at),
            }}
          />

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Enjoying this content? Support the creator by listening to the full episode.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
