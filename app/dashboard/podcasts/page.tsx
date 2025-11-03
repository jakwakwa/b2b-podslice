import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { PodcastGrid } from "@/components/podcast-grid"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PodcastsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const podcasts = await sql`
    SELECT p.*, 
      (SELECT COUNT(*) FROM episodes WHERE podcast_id = p.id) as episode_count
    FROM podcasts p
    WHERE p.organization_id = ${user.organization_id}
    ORDER BY p.created_at DESC
  `

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Podcasts</h1>
            <p className="mt-2 text-muted-foreground">Manage your podcast shows</p>
          </div>
          <Link href="/dashboard/podcasts/new">
            <Button>Add Podcast</Button>
          </Link>
        </div>

        <PodcastGrid podcasts={podcasts} />
      </main>
    </div>
  )
}
