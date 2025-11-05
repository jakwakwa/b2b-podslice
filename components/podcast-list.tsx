import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Podcast = {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    category: string | null;
};

export function PodcastList({ podcasts }: { podcasts: Podcast[] }) {
    if (podcasts.length === 0) {
        return (
            <Card className="p-8 text-center">
                <p className="text-muted-foreground">No podcasts yet</p>
                <Link href="/dashboard/podcasts/new">
                    <Button className="mt-4">Add Your First Podcast</Button>
                </Link>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {podcasts.map(podcast => (
                <Link key={podcast.id} href={`/dashboard/podcasts/${podcast.id}`}>
                    <Card className="p-4 transition-colors hover:bg-[var(--beduk-4)]/50">
                        <div className="flex items-center gap-4">
                            {podcast.cover_image_url ? (
                                <img
                                    src={podcast.cover_image_url || "/placeholder.svg"}
                                    alt={podcast.title}
                                    className="h-16 w-16 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--beduk-4)]">
                                    <span className="text-2xl font-bold text-muted-foreground">
                                        {podcast.title[0]}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="font-semibold">{podcast.title}</h3>
                                {podcast.description && (
                                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                                        {podcast.description}
                                    </p>
                                )}
                                {podcast.category && (
                                    <span className="mt-2 inline-block text-xs text-muted-foreground">
                                        {podcast.category}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
