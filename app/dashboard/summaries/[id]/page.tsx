import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { SummaryActions } from "@/components/summary-actions"

export default async function SummaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const summaries = await sql`
    SELECT s.*, e.title as episode_title, e.id as episode_id, p.title as podcast_title
    FROM summaries s
    INNER JOIN episodes e ON e.id = s.episode_id
    INNER JOIN podcasts p ON p.id = e.podcast_id
    WHERE s.id = ${id} AND p.organization_id = ${user.organization_id}
    LIMIT 1
  `

  if (summaries.length === 0) {
    redirect("/dashboard")
  }

  const summary = summaries[0]

  const typeLabels: Record<string, string> = {
    full: "Full Summary",
    highlight: "Highlights",
    social_twitter: "Twitter Post",
    social_linkedin: "LinkedIn Post",
    social_instagram: "Instagram Caption",
    show_notes: "Show Notes",
  }

  const typeColors: Record<string, string> = {
    full: "bg-blue-500/10 text-blue-500",
    highlight: "bg-purple-500/10 text-purple-500",
    social_twitter: "bg-sky-500/10 text-sky-500",
    social_linkedin: "bg-indigo-500/10 text-indigo-500",
    social_instagram: "bg-pink-500/10 text-pink-500",
    show_notes: "bg-green-500/10 text-green-500",
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href={`/dashboard/episodes/${summary.episode_id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Episode
          </Link>
        </div>

        <Card className="p-8">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={typeColors[summary.summary_type] || "bg-muted"}>
                  {typeLabels[summary.summary_type] || summary.summary_type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(summary.created_at).toLocaleDateString()}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold">{summary.episode_title}</h1>
              <p className="mt-2 text-muted-foreground">{summary.podcast_title}</p>
            </div>
            <SummaryActions summaryId={id} content={summary.content} />
          </div>

          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap leading-relaxed">{summary.content}</div>
          </div>

          <div className="mt-8 flex items-center gap-6 border-t pt-6 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">{summary.view_count}</span> views
            </div>
            <div>
              <span className="font-medium">{summary.share_count}</span> shares
            </div>
            <div>Last updated: {new Date(summary.updated_at).toLocaleDateString()}</div>
          </div>
        </Card>
      </main>
    </div>
  )
}
