"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadEpisode } from "@/app/actions/episodes"

type Podcast = {
  id: string
  title: string
}

export function EpisodeUploadForm({
  podcasts,
  defaultPodcastId,
}: {
  podcasts: Podcast[]
  defaultPodcastId?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    setUploadProgress(0)

    const formData = new FormData(e.currentTarget)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await uploadEpisode(formData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      // If successful, the action will redirect
    } catch (err) {
      setError("Failed to upload episode")
      setLoading(false)
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
            {podcasts.map((podcast) => (
              <SelectItem key={podcast.id} value={podcast.id}>
                {podcast.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Episode Title</Label>
        <Input id="title" name="title" type="text" placeholder="Episode 1: Introduction" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" placeholder="Describe what this episode is about..." rows={4} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="episode_number">Episode Number</Label>
          <Input id="episode_number" name="episode_number" type="number" placeholder="1" min="1" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="season_number">Season Number</Label>
          <Input id="season_number" name="season_number" type="number" placeholder="1" min="1" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="audio_file">Audio File</Label>
        <Input id="audio_file" name="audio_file" type="file" accept="audio/*" required />
        <p className="text-sm text-muted-foreground">Supported formats: MP3, WAV, M4A (Max 500MB)</p>
      </div>

      {loading && uploadProgress > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uploading...</span>
            <span className="font-medium">{uploadProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Uploading..." : "Upload Episode"}
        </Button>
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
