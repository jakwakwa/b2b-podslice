"use client";

import type React from "react";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { finalizeEpisodeUpload } from "@/app/actions/episodes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Podcast = {
    id: string;
    title: string;
};

export function EpisodeUploadForm({
    podcasts,
    defaultPodcastId,
}: {
    podcasts: Podcast[];
    defaultPodcastId?: string;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);
        setUploadProgress(0);

        const form = e.currentTarget;
        const formData = new FormData(form);
        const fileInput = formData.get("audio_file") as File | null;
        const podcastId = formData.get("podcast_id") as string | null;

        if (!fileInput || !(fileInput instanceof File)) {
            setError("Please select an audio file");
            setLoading(false);
            return;
        }

        if (!podcastId) {
            setError("Please select a podcast");
            setLoading(false);
            return;
        }

        // Ensure we have a valid File object with all required properties
        if (!fileInput.name || fileInput.size === 0) {
            setError("Invalid file selected");
            setLoading(false);
            return;
        }

        // Ensure we have a proper File object
        // FormData.get() should return a File, but ensure it's valid
        const file = fileInput;

        try {
            // Direct upload to Vercel Blob
            // upload(pathname, body, options) - pathname is required!
            const pathname = `episodes/${podcastId}/${Date.now()}-${file.name}`;
            const result = await upload(pathname, file, {
                access: "public",
                handleUploadUrl: "/api/uploads/episodes",
                clientPayload: podcastId,
                multipart: true,
                onUploadProgress: (evt) => {
                    if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
                },
            });

            // Finalize episode creation with the blob URL
            await finalizeEpisodeUpload({
                podcastId,
                title: String(formData.get("title") || ""),
                description: String(formData.get("description") || ""),
                episodeNumber: Number(formData.get("episode_number") || 0) || null,
                seasonNumber: Number(formData.get("season_number") || 0) || null,
                audioUrl: result.url,
                fileSize: result.size ?? file.size,
                contentType: file.type,
            });

            // If successful, the action will redirect
        } catch (err) {
            console.error("Upload error:", err);
            setError(err instanceof Error ? err.message : "Failed to upload episode");
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="podcast_id">Podcast</Label>
                <Select name="podcast_id" defaultValue={defaultPodcastId} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a podcast" />
                    </SelectTrigger>
                    <SelectContent>
                        {podcasts.map(podcast => (
                            <SelectItem key={podcast.id} value={podcast.id}>
                                {podcast.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="title">Episode Title</Label>
                <Input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Episode 1: Introduction"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what this episode is about..."
                    rows={4}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="episode_number">Episode Number</Label>
                    <Input
                        id="episode_number"
                        name="episode_number"
                        type="number"
                        placeholder="1"
                        min="1"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="season_number">Season Number</Label>
                    <Input
                        id="season_number"
                        name="season_number"
                        type="number"
                        placeholder="1"
                        min="1"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="audio_file">Audio File</Label>
                <Input id="audio_file" name="audio_file" type="file" accept="audio/*" required />
                <p className="text-sm text-muted-foreground">
                    Supported formats: MP3, WAV, M4A, AAC, OGG, WebM (Max 5GB)
                </p>
            </div>

            {loading && uploadProgress > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Uploading...</span>
                        <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--beduk-4)]">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Uploading..." : "Upload Episode"}
                </Button>
                <Button type="button" variant="outline" disabled={loading}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
