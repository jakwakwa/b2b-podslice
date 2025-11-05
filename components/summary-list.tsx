"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Summary = {
    id: string;
    summary_type: string;
    content: string;
    view_count: number;
    share_count: number;
    created_at: Date;
};

export function SummaryList({
    summaries,
    episodeId,
}: {
    summaries: Summary[];
    episodeId: string;
}) {
    if (summaries.length === 0) {
        return (
            <Card className="p-8 text-center">
                <p className="text-muted-foreground">No summaries generated yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                    Click "Generate Summaries" to create AI-powered content
                </p>
            </Card>
        );
    }

    const typeLabels: Record<string, string> = {
        full: "Full Summary",
        highlight: "Highlights",
        social_twitter: "Twitter Post",
        social_linkedin: "LinkedIn Post",
        social_instagram: "Instagram Caption",
        show_notes: "Show Notes",
    };

    const typeColors: Record<string, string> = {
        full: "bg-blue-500/10 text-blue-500",
        highlight: "bg-purple-500/10 text-purple-500",
        social_twitter: "bg-sky-500/10 text-sky-500",
        social_linkedin: "bg-indigo-500/10 text-indigo-500",
        social_instagram: "bg-pink-500/10 text-pink-500",
        show_notes: "bg-green-500/10 text-teal-500",
    };

    return (
        <div className="space-y-4">
            {summaries.map(summary => (
                <Card key={summary.id} className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="secondary"
                                    className={typeColors[summary.summary_type] || "bg-[var(--beduk-4)]"}>
                                    {typeLabels[summary.summary_type] || summary.summary_type}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(summary.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed line-clamp-3">
                                {summary.content}
                            </p>
                            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{summary.view_count} views</span>
                                <span>{summary.share_count} shares</span>
                            </div>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                            <Link href={`/dashboard/summaries/${summary.id}`}>
                                <Button variant="outline" size="sm" className="w-full bg-transparent">
                                    View
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(summary.content)}>
                                Copy
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
