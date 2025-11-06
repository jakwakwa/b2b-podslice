import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
export default async function EpisodesPage() {
    const user = await getCurrentUser();

    if (!(user?.organization_id)) {
        redirect("/sign-in");
    }

    const episodes = await prisma.episodes.findMany({
        where: {
            podcasts: {
                organization_id: user.organization_id,
            },
        },
        orderBy: { created_at: "desc" },
    });

    const statusColors = {
        pending: "bg-yellow-500/10 text-yellow-500",
        processing: "bg-blue-500/10 text-blue-500",
        completed: "bg-success/10 text-teal-500",
        failed: "bg-red-500/10 text-red-500",
    };

    function formatDuration(seconds: number | null) {
        if (!seconds) return "N/A";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    return (
        <div className="min-h-screen ">
            <DashboardHeader user={user} />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Episodes</h1>
                        <p className="mt-2 text-muted-foreground">Manage all your podcast episodes</p>
                    </div>
                    <Link href="/dashboard/episodes/new">
                        <Button>Upload Episode</Button>
                    </Link>
                </div>

                {episodes.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-(--beduk-4)">
                            <svg
                                className="h-12 w-12 text-muted-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-6 text-xl font-semibold">No episodes yet</h3>
                        <p className="mt-2 text-muted-foreground">
                            Upload your first episode to get started
                        </p>
                        <Link href="/dashboard/episodes/new">
                            <Button className="mt-6">Upload Episode</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-2">
                        {episodes.map(episode => (
                            <Link key={episode.id} href={`/dashboard/episodes/${episode.id}`}>
                                <Card className="p-4 transition-colors hover:bg-(--beduk-4)/50">
                                    <div className="flex items-start gap-4">
                                        {episode.podcast_cover ? (
                                            <Image
                                                src={episode.podcast_cover || "/placeholder.svg"}
                                                alt={episode.podcast_title || "Episode Cover"}
                                                className="h-16 w-16 rounded object-cover"
                                                width={64}
                                                height={64}
                                            />
                                        ) : (
                                            <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-200">
                                                <span className="text-sm font-black text-muted-foreground">
                                                    {episode.podcast_title ? episode.podcast_title.slice(0, 2) : "N/A"}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{episode.title}</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {episode.podcast_title}
                                            </p>
                                            {episode.description && (
                                                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                                                    {episode.description}
                                                </p>
                                            )}
                                            <div className="mt-3 flex items-center gap-3">
                                                <Badge
                                                    variant="secondary"
                                                    className={
                                                        statusColors[
                                                        episode.processing_status as keyof typeof statusColors
                                                        ]
                                                    }>
                                                    {episode.processing_status}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDuration(episode.duration_seconds)}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {episode.summary_count}{" "}
                                                    {episode.summary_count === 1 ? "summary" : "summaries"}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {episode.created_at
                                                        ? new Date(episode.created_at).toLocaleDateString()
                                                        : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
