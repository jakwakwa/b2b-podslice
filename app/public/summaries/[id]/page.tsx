import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicEpisodeAudio } from "@/components/public-episode-audio";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";

export default async function PublicSummaryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Check if summary is from an organization with B2C license
    const summary = await prisma.summaries.findFirst({
        where: {
            id,
            episodes: {
                podcasts: {},
            },
        },

        include: {
            episodes: {
                select: {
                    title: true,
                    audio_url: true,
                },
            },
        },
    });

    if (!summary) {
        notFound();
    }

    // Track view - create analytics event
    await prisma.analytics_events.create({
        data: {
            summary_id: id,
            event_type: "view",
            metadata: { source: "public" },
        },
    });

    // Update view count
    await prisma.summaries.update({
        where: { id },
        data: { view_count: (summary.view_count || 0) + 1 },
    });

    const typeLabels: Record<string, string> = {
        full: "Full Summary",
        highlight: "Highlights",
        social_twitter: "Twitter Post",
        social_linkedin: "LinkedIn Post",
        social_instagram: "Instagram Caption",
        show_notes: "Show Notes",
    };

    return (
        <div className="min-h-screen ">
            <header className="border-b  backdrop-blur-2xl">
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
                        <h1 className="text-4xl font-bold">{typeLabels[summary.summary_type] || summary.summary_type}</h1>
                        <p className="mt-2 text-xl text-muted-foreground">
                            {summary.content}
                        </p>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Enjoying this content? Support the creator by listening to the full episode.
                        </p>
                    </div>

                    {summary.episodes.audio_url && (
                        <PublicEpisodeAudio
                            summaryId={summary.id}
                            audioUrl={summary.episodes.audio_url}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
