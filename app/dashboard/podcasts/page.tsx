import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { PodcastGrid } from "@/components/podcast-grid"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PodcastsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const podcasts = await prisma.podcasts.findMany({
    where: { organization_id: user.organization_id },
    include: {
      episodes: {
        select: { id: true },
      },
    },
    orderBy: { created_at: "desc" },
  })

  // Map to include episode_count
  const podcastsWithCounts = podcasts.map((p) => ({
    ...p,
    episode_count: p.episodes.length,
  }))

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

        <PodcastGrid podcasts={podcastsWithCounts} />
      </main>
    </div>
  )
}
