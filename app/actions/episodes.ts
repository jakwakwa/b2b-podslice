"use server"

import { redirect } from "next/navigation"
import { put } from "@vercel/blob"
import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function uploadEpisode(formData: FormData) {
  const user = await requireAuth()

  const podcastId = formData.get("podcast_id") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const episodeNumber = formData.get("episode_number") as string
  const seasonNumber = formData.get("season_number") as string
  const audioFile = formData.get("audio_file") as File

  if (!audioFile || audioFile.size === 0) {
    return { error: "Please select an audio file" }
  }

  // Verify podcast belongs to user's organization
  const podcasts = await sql`
    SELECT id FROM podcasts 
    WHERE id = ${podcastId} AND organization_id = ${user.organization_id}
    LIMIT 1
  `

  if (podcasts.length === 0) {
    return { error: "Podcast not found" }
  }

  try {
    // Upload audio file to Vercel Blob
    const blob = await put(`episodes/${podcastId}/${Date.now()}-${audioFile.name}`, audioFile, {
      access: "public",
    })

    // Create episode record
    const episodes = await sql`
      INSERT INTO episodes (
        podcast_id, 
        title, 
        description, 
        audio_url, 
        file_size_bytes,
        episode_number,
        season_number,
        processing_status
      )
      VALUES (
        ${podcastId},
        ${title},
        ${description || null},
        ${blob.url},
        ${audioFile.size},
        ${episodeNumber ? Number.parseInt(episodeNumber) : null},
        ${seasonNumber ? Number.parseInt(seasonNumber) : null},
        'completed'
      )
      RETURNING id
    `

    const episodeId = episodes[0].id

    redirect(`/dashboard/episodes/${episodeId}`)
  } catch (error) {
    console.error("[v0] Episode upload error:", error)
    return { error: "Failed to upload episode" }
  }
}

export async function deleteEpisode(episodeId: string) {
  const user = await requireAuth()

  // Verify episode belongs to user's organization
  const episodes = await sql`
    SELECT e.id FROM episodes e
    INNER JOIN podcasts p ON p.id = e.podcast_id
    WHERE e.id = ${episodeId} AND p.organization_id = ${user.organization_id}
    LIMIT 1
  `

  if (episodes.length === 0) {
    return { error: "Episode not found" }
  }

  await sql`DELETE FROM episodes WHERE id = ${episodeId}`

  return { success: true }
}
