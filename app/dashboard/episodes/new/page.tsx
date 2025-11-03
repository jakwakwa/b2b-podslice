import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { EpisodeUploadForm } from "@/components/episode-upload-form"
import { Card } from "@/components/ui/card"

export default async function NewEpisodePage({
  searchParams,
}: {
  searchParams: Promise<{ podcast?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const podcasts = await sql`
    SELECT id, title FROM podcasts 
    WHERE organization_id = ${user.organization_id}
    ORDER BY title ASC
  `

  if (podcasts.length === 0) {
    redirect("/dashboard/podcasts/new")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold">Upload Episode</h1>
          <p className="mt-2 text-muted-foreground">Add a new episode to your podcast</p>

          <Card className="mt-8 p-6">
            <EpisodeUploadForm podcasts={podcasts} defaultPodcastId={params.podcast} />
          </Card>
        </div>
      </main>
    </div>
  )
}
