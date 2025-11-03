"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createPodcast } from "@/app/actions/podcasts"

export function PodcastCreateForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await createPodcast(formData)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      // If successful, the action will redirect
    } catch (err) {
      setError("Failed to create podcast")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Podcast Title *</Label>
        <Input id="title" name="title" type="text" placeholder="My Awesome Podcast" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Tell us about your podcast..."
          rows={4}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input id="author" name="author" type="text" placeholder="Your Name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" type="text" placeholder="e.g., Technology, Business" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Website URL</Label>
        <Input id="website_url" name="website_url" type="url" placeholder="https://example.com" />
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Creating..." : "Create Podcast"}
        </Button>
        <Button type="button" variant="outline" disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
