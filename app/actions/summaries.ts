"use server"

import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import {
  generateEpisodeSummary,
  generateHighlights,
  generateSocialPost,
  generateShowNotes,
  generateTranscript,
} from "@/lib/ai"

export async function generateAllSummaries(episodeId: string) {
  const user = await requireAuth()

  // Verify episode belongs to user's organization
  const episode = await prisma.episodes.findFirst({
    where: {
      id: episodeId,
      podcasts: {
        organization_id: user.organization_id,
      },
    },
    include: {
      podcasts: {
        select: { organization_id: true },
      },
    },
  })

  if (!episode) {
    return { error: "Episode not found" }
  }

  try {
    // Update status to processing
    await prisma.episodes.update({
      where: { id: episodeId },
      data: { processing_status: "processing" },
    })

    // Generate or get transcript
    let transcript = episode.transcript
    if (!transcript) {
      transcript = await generateTranscript(episode.audio_url)
      await prisma.episodes.update({
        where: { id: episodeId },
        data: { transcript },
      })
    }

    // Generate full summary
    const fullSummary = await generateEpisodeSummary(episode.title, episode.description || "", transcript)

    await prisma.summaries.create({
      data: {
        episode_id: episodeId,
        summary_type: "full",
        content: fullSummary,
      },
    })

    // Generate highlights
    const highlights = await generateHighlights(episode.title, transcript)

    await prisma.summaries.create({
      data: {
        episode_id: episodeId,
        summary_type: "highlight",
        content: highlights,
      },
    })

    // Generate social media posts
    const twitterPost = await generateSocialPost("twitter", episode.title, episode.description || "", fullSummary)
    await prisma.summaries.create({
      data: {
        episode_id: episodeId,
        summary_type: "social_twitter",
        content: twitterPost,
      },
    })

    const linkedinPost = await generateSocialPost("linkedin", episode.title, episode.description || "", fullSummary)
    await prisma.summaries.create({
      data: {
        episode_id: episodeId,
        summary_type: "social_linkedin",
        content: linkedinPost,
      },
    })

    const instagramPost = await generateSocialPost("instagram", episode.title, episode.description || "", fullSummary)
    await prisma.summaries.create({
      data: {
        episode_id: episodeId,
        summary_type: "social_instagram",
        content: instagramPost,
      },
    })

    // Generate show notes
    const showNotes = await generateShowNotes(episode.title, episode.description || "", transcript)
    await prisma.summaries.create({
      data: {
        episode_id: episodeId,
        summary_type: "show_notes",
        content: showNotes,
      },
    })

    // Update status to completed
    await prisma.episodes.update({
      where: { id: episodeId },
      data: { processing_status: "completed" },
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Summary generation error:", error)

    // Update status to failed
    await prisma.episodes.update({
      where: { id: episodeId },
      data: { processing_status: "failed" },
    })

    return { error: "Failed to generate summaries" }
  }
}

export async function regenerateSummary(summaryId: string) {
  const user = await requireAuth()

  // Verify summary belongs to user's organization
  const summary = await prisma.summaries.findFirst({
    where: {
      id: summaryId,
      episodes: {
        podcasts: {
          organization_id: user.organization_id,
        },
      },
    },
    include: {
      episodes: {
        select: {
          title: true,
          description: true,
          transcript: true,
        },
      },
    },
  })

  if (!summary) {
    return { error: "Summary not found" }
  }

  try {
    let newContent = ""

    switch (summary.summary_type) {
      case "full":
        newContent = await generateEpisodeSummary(
          summary.episodes.title,
          summary.episodes.description || "",
          summary.episodes.transcript || "",
        )
        break
      case "highlight":
        newContent = await generateHighlights(summary.episodes.title, summary.episodes.transcript || "")
        break
      case "social_twitter":
        newContent = await generateSocialPost(
          "twitter",
          summary.episodes.title,
          summary.episodes.description || "",
          summary.content,
        )
        break
      case "social_linkedin":
        newContent = await generateSocialPost(
          "linkedin",
          summary.episodes.title,
          summary.episodes.description || "",
          summary.content,
        )
        break
      case "social_instagram":
        newContent = await generateSocialPost(
          "instagram",
          summary.episodes.title,
          summary.episodes.description || "",
          summary.content,
        )
        break
      case "show_notes":
        newContent = await generateShowNotes(
          summary.episodes.title,
          summary.episodes.description || "",
          summary.episodes.transcript || "",
        )
        break
    }

    await prisma.summaries.update({
      where: { id: summaryId },
      data: {
        content: newContent,
        updated_at: new Date(),
      },
    })

    return { success: true, content: newContent }
  } catch (error) {
    console.error("[v0] Regenerate summary error:", error)
    return { error: "Failed to regenerate summary" }
  }
}
