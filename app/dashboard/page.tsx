import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentEpisodes } from "@/components/recent-episodes"
import { PodcastList } from "@/components/podcast-list"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Fetch dashboard statistics
  const stats = await sql`
    SELECT 
      (SELECT COUNT(*) FROM podcasts WHERE organization_id = ${user.organization_id}) as podcast_count,
      (SELECT COUNT(*) FROM episodes e 
       INNER JOIN podcasts p ON p.id = e.podcast_id 
       WHERE p.organization_id = ${user.organization_id}) as episode_count,
      (SELECT COALESCE(SUM(view_count), 0) FROM summaries s
       INNER JOIN episodes e ON e.id = s.episode_id
       INNER JOIN podcasts p ON p.id = e.podcast_id
       WHERE p.organization_id = ${user.organization_id}) as total_views,
      (SELECT COALESCE(SUM(calculated_amount), 0) FROM royalties 
       WHERE organization_id = ${user.organization_id} AND payment_status = 'paid') as total_earnings
  `

  const podcasts = await sql`
    SELECT * FROM podcasts 
    WHERE organization_id = ${user.organization_id}
    ORDER BY created_at DESC
  `

  const recentEpisodes = await sql`
    SELECT e.*, p.title as podcast_title, p.cover_image_url as podcast_cover
    FROM episodes e
    INNER JOIN podcasts p ON p.id = e.podcast_id
    WHERE p.organization_id = ${user.organization_id}
    ORDER BY e.created_at DESC
    LIMIT 5
  `

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Welcome back, {user.full_name}</p>
        </div>

        <DashboardStats stats={stats[0]} />

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Your Podcasts</h2>
            <PodcastList podcasts={podcasts} />
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-semibold">Recent Episodes</h2>
            <RecentEpisodes episodes={recentEpisodes} />
          </div>
        </div>
      </main>
    </div>
  )
}
