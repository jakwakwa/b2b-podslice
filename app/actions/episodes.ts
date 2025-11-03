"use server"

import { redirect } from "next/navigation"
import { put } from "@vercel/blob"
import prisma from "@/lib/prisma"
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
  const podcast = await prisma.podcasts.findFirst({
    where: {
      id: podcastId,
      organization_id: user.organization_id,
    },
  })

  if (!podcast) {
    return { error: "Podcast not found" }
  }

  try {
    // Upload audio file to Vercel Blob
    const blob = await put(`episodes/${podcastId}/${Date.now()}-${audioFile.name}`, audioFile, {
      access: "public",
    })

    // Create episode record using Prisma
    const episode = await prisma.episodes.create({
      data: {
        podcast_id: podcastId,
        title,
        description: description || null,
        audio_url: blob.url,
        file_size_bytes: BigInt(audioFile.size),
        episode_number: episodeNumber ? Number.parseInt(episodeNumber) : null,
        season_number: seasonNumber ? Number.parseInt(seasonNumber) : null,
        processing_status: "completed",
      },
    })

    redirect(`/dashboard/episodes/${episode.id}`)
  } catch (error) {
    console.error("[v0] Episode upload error:", error)
    return { error: "Failed to upload episode" }
  }
}

export async function deleteEpisode(episodeId: string) {
  const user = await requireAuth()

  // Verify episode belongs to user's organization
  const episode = await prisma.episodes.findFirst({
    where: {
      id: episodeId,
      podcasts: {
        organization_id: user.organization_id,
      },
    },
  })

  if (!episode) {
    return { error: "Episode not found" }
  }

  await prisma.episodes.delete({
    where: {
      id: episodeId,
    },
  })

  return { success: true }
}
