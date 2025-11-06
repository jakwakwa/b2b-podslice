import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Summary = {
    id: string;
    summary_type: string;
    content: string;
    view_count: number;
    share_count: number;
    episode_title: string;
    podcast_title: string;
};

export function TopContent({ summaries }: { summaries: Summary[] }) {
    if (summaries.length === 0) {
        return (
            <Card className="p-8 text-center">
                <p className="text-muted-foreground">No content data available</p>
            </Card>
        );
    }

    const typeLabels: Record<string, string> = {
        full: "Full Summary",
        highlight: "Highlights",
        social_twitter: "Twitter",
        social_linkedin: "LinkedIn",
        social_instagram: "Instagram",
        show_notes: "Show Notes",
    };

    return (
        <div className="mt-2 gap-3 flex flex-col">
            {summaries.map((summary, index) => (
                <Link key={summary.id} href={`/dashboard/summaries/${summary.id}`}>
                    <Card className="p-4 transition-colors hover:bg-[var(--beduk-4)]/50">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                        {typeLabels[summary.summary_type] || summary.summary_type}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {summary.podcast_title}
                                    </span>
                                </div>
                                <h3 className="mt-1 font-semibold">{summary.episode_title}</h3>
                                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                                    {summary.content}
                                </p>
                                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>{summary.view_count} views</span>
                                    <span>{summary.share_count} shares</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
