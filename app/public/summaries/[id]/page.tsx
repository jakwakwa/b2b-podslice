import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { SummaryWithAttribution } from "@/components/summary-with-attribution"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { PublicEpisodeAudio } from "@/components/public-episode-audio"

export default async function PublicSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Check if summary is from an organization with B2C license
  const summary = await prisma.summaries.findFirst({
    where: {
      id,
      episodes: {
        podcasts: {
          licenses: {
            some: {
              is_active: true,
              license_type: "b2b_b2c",
            },
          },
        },
      },
    },
    include: {
      episodes: {
        select: {
          title: true,
          audio_url: true,
          podcasts: {
            select: {
              title: true,
              website_url: true,
              organizations: {
                select: {
                  name: true,
                  website: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!summary) {
    notFound()
  }

  // Track view - create analytics event
  await prisma.analytics_events.create({
    data: {
      summary_id: id,
      event_type: "view",
      metadata: { source: "public" },
    },
  })

  // Update view count
  await prisma.summaries.update({
    where: { id },
    data: { view_count: (summary.view_count || 0) + 1 },
  })

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
            <h1 className="text-4xl font-bold">{summary.episodes.title}</h1>
            <p className="mt-2 text-xl text-muted-foreground">{summary.episodes.podcasts.title}</p>
          </div>

          <SummaryWithAttribution
            content={summary.content}
            attribution={{
              podcastTitle: summary.episodes.podcasts.title,
              episodeTitle: summary.episodes.title,
              episodeUrl: summary.episodes.audio_url,
              creatorName: summary.episodes.podcasts.organizations.name,
              creatorWebsite: summary.episodes.podcasts.organizations.website,
              generatedAt: new Date(summary.created_at),
            }}
          />

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Enjoying this content? Support the creator by listening to the full episode.
            </p>
          </div>

          {summary.episodes.audio_url && (
            <PublicEpisodeAudio summaryId={summary.id} audioUrl={summary.episodes.audio_url} />
          )}
        </div>
      </main>
    </div>
  )
}
