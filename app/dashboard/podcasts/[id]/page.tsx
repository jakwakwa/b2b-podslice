import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { EpisodeList } from "@/components/episode-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function PodcastDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in");
    }

    // Fetch podcast with episode count
    const podcast = await prisma.podcasts.findFirst({
        where: {
            id,
            organization_id: user.organization_id,
        },
    });

    if (!podcast) {
        redirect("/dashboard/podcasts");
    }

    // Fetch episodes for this podcast
    const episodes = await prisma.episodes.findMany({
        where: {
            podcast_id: id,
        },
        include: {
            summaries: {
                select: {
                    id: true,
                },
            },
        },
        orderBy: {
            created_at: "desc",
        },
    });

    return (
        <div className="min-h-screen ">
            <DashboardHeader user={user} />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link
                        href="/dashboard/podcasts"
                        className="text-sm text-muted-foreground hover:text-foreground">
                        ← Back to Podcasts
                    </Link>
                </div>

                <Card className="mb-8 p-6">
                    <div className="flex gap-6">
                        {podcast.cover_image_url ? (
                            <img
                                src={podcast.cover_image_url || "/placeholder.svg"}
                                alt={podcast.title}
                                className="h-32 w-32 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-[var(--beduk-4)]">
                                <span className="text-4xl font-bold text-muted-foreground">
                                    {podcast.title[0]}
                                </span>
                            </div>
                        )}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold">{podcast.title}</h1>
                            {podcast.description && (
                                <p className="mt-2 text-muted-foreground">{podcast.description}</p>
                            )}
                            <div className="mt-4 flex gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Category:</span>
                                    <span className="ml-2 font-medium">{podcast.category || "N/A"}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Episodes:</span>
                                    <span className="ml-2 font-medium">{episodes.length}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Link href={`/dashboard/podcasts/${id}/edit`}>
                                <Button variant="outline" className="w-full bg-transparent">
                                    Edit
                                </Button>
                            </Link>
                            <Link href={`/dashboard/episodes/new?podcast=${id}`}>
                                <Button className="w-full">Add Episode</Button>
                            </Link>
                        </div>
                    </div>
                </Card>

                <div>
                    <h2 className="mb-4 text-2xl font-semibold">Episodes</h2>
                    <EpisodeList episodes={episodes} podcastId={id} />
                </div>
            </main>
        </div>
    );
}
