import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { GenerateSummariesButton } from "@/components/generate-summaries-button";
import { SummaryList } from "@/components/summary-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export default async function EpisodeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in");
    }

    const episode = await prisma.episodes.findFirst({
        where: {
            id,
            podcasts: {
                organization_id: user.organization_id,
            },
        },
        include: {
            podcasts: {
                select: {
                    title: true,
                    id: true,
                },
            },
        },
    });

    if (!episode) {
        redirect("/dashboard/episodes");
    }

    const summaries = await prisma.summaries.findMany({
        where: { episode_id: id },
        orderBy: { created_at: "desc" },
    });

    const statusColors = {
        pending: "bg-yellow-500/10 text-yellow-500",
        processing: "bg-blue-500/10 text-blue-500",
        completed: "bg-green-500/10 text-teal-500",
        failed: "bg-red-500/10 text-red-500",
    };

    function formatDuration(seconds: number | null) {
        if (!seconds) return "N/A";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader user={user} />

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link
                        href={`/dashboard/podcasts/${episode.podcasts.id}`}
                        className="text-sm text-muted-foreground hover:text-foreground">
                        ← Back to {episode.podcasts.title}
                    </Link>
                </div>

                <Card className="mb-8 p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold">{episode.title}</h1>
                                <Badge
                                    variant="secondary"
                                    className={
                                        statusColors[episode.processing_status as keyof typeof statusColors]
                                    }>
                                    {episode.processing_status}
                                </Badge>
                            </div>
                            {episode.description && (
                                <p className="mt-4 text-muted-foreground leading-relaxed">
                                    {episode.description}
                                </p>
                            )}
                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <div>
                                    <span className="text-sm text-muted-foreground">Duration</span>
                                    <p className="mt-1 font-medium">
                                        {formatDuration(episode.duration_seconds)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Published</span>
                                    <p className="mt-1 font-medium">
                                        {episode.published_at
                                            ? new Date(episode.published_at).toLocaleDateString()
                                            : "Not published"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Summaries</span>
                                    <p className="mt-1 font-medium">{summaries.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {episode.processing_status === "completed" && summaries.length === 0 && (
                                <GenerateSummariesButton episodeId={id} />
                            )}
                            <Link href={`/dashboard/episodes/${id}/edit`}>
                                <Button variant="outline" className="w-full bg-transparent">
                                    Edit
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {episode.audio_url && (
                        <div className="mt-6">
                            <span className="text-sm font-medium">Audio</span>
                            <audio controls className="mt-2 w-full">
                                <source src={episode.audio_url} type="audio/mpeg" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}
                </Card>

                <div>
                    <h2 className="mb-4 text-2xl font-semibold">Generated Summaries</h2>
                    <SummaryList summaries={summaries} episodeId={id} />
                </div>
            </main>
        </div>
    );
}
