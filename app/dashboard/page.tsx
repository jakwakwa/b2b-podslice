import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardStats } from "@/components/dashboard-stats";
import { PodcastList } from "@/components/podcast-list";
import { RecentEpisodes } from "@/components/recent-episodes";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in");
    }

    if (!user.organization_id) {
        redirect("/sign-in");
    }

    // Fetch podcast count
    const podcastCount = await prisma.podcasts.count({
        where: { organization_id: user.organization_id },
    });

    // Fetch episode count
    const episodeCount = await prisma.episodes.count({
        where: {
            podcasts: {
                organization_id: user.organization_id,
            },
        },
    });

    // Fetch total views from summaries
    const summaryData = await prisma.summaries.aggregate({
        where: {
            episodes: {
                podcasts: {
                    organization_id: user.organization_id,
                },
            },
        },
        _sum: {
            view_count: true,
        },
    });

    // Fetch total earnings from paid royalties
    const royaltyData = await prisma.royalties.aggregate({
        where: {
            organization_id: user.organization_id,
            payment_status: "paid",
        },
        _sum: {
            calculated_amount: true,
        },
    });

    const stats = {
        podcast_count: podcastCount,
        episode_count: episodeCount,
        total_views: summaryData._sum?.view_count || 0,
        total_earnings: Number(royaltyData._sum?.calculated_amount || 0),
    };

    // Fetch podcasts
    const podcasts = await prisma.podcasts.findMany({
        where: { organization_id: user.organization_id },
        orderBy: { created_at: "desc" },
    });

    // Fetch recent episodes with podcast info
    const recentEpisodes = await prisma.episodes.findMany({
        where: {
            podcasts: {
                organization_id: user.organization_id,
            },
        },
        include: {
            podcasts: {
                select: {
                    title: true,
                    cover_image_url: true,
                },
            },
        },
        orderBy: { created_at: "desc" },
        take: 5,
    })

    // Map episodes to include podcast_title and podcast_cover
    const mappedEpisodes = recentEpisodes.map((ep) => ({
        id: ep.id,
        title: ep.title,
        podcast_title: ep.podcasts.title,
        podcast_cover: ep.podcasts.cover_image_url,
        processing_status: ep.processing_status || "pending",
        created_at: ep.created_at || new Date(),
    }))

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader user={user} />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="mt-2 text-muted-foreground">Welcome back, {user.full_name}</p>
                </div>

                <DashboardStats stats={stats} />

                <div className="mt-8 grid gap-8 lg:grid-cols-2">
                    <div>
                        <h2 className="mb-4 text-2xl font-semibold">Your Podcasts</h2>
                        <PodcastList podcasts={podcasts} />
                    </div>

                    <div>
                        <h2 className="mb-4 text-2xl font-semibold">Recent Episodes</h2>
                        <RecentEpisodes episodes={mappedEpisodes} />
                    </div>
                </div>
            </main>
        </div>
    );
}
