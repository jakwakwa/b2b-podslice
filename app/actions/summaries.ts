"use server"

import { sql } from "@/lib/db"
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
  const episodes = await sql`
    SELECT e.*, p.organization_id 
    FROM episodes e
    INNER JOIN podcasts p ON p.id = e.podcast_id
    WHERE e.id = ${episodeId} AND p.organization_id = ${user.organization_id}
    LIMIT 1
  `

  if (episodes.length === 0) {
    return { error: "Episode not found" }
  }

  const episode = episodes[0]

  try {
    // Update status to processing
    await sql`
      UPDATE episodes 
      SET processing_status = 'processing'
      WHERE id = ${episodeId}
    `

    // Generate or get transcript
    let transcript = episode.transcript
    if (!transcript) {
      transcript = await generateTranscript(episode.audio_url)
      await sql`
        UPDATE episodes 
        SET transcript = ${transcript}
        WHERE id = ${episodeId}
      `
    }

    // Generate full summary
    const fullSummary = await generateEpisodeSummary(episode.title, episode.description || "", transcript)

    await sql`
      INSERT INTO summaries (episode_id, summary_type, content)
      VALUES (${episodeId}, 'full', ${fullSummary})
    `

    // Generate highlights
    const highlights = await generateHighlights(episode.title, transcript)

    await sql`
      INSERT INTO summaries (episode_id, summary_type, content)
      VALUES (${episodeId}, 'highlight', ${highlights})
    `

    // Generate social media posts
    const twitterPost = await generateSocialPost("twitter", episode.title, episode.description || "", fullSummary)
    await sql`
      INSERT INTO summaries (episode_id, summary_type, content)
      VALUES (${episodeId}, 'social_twitter', ${twitterPost})
    `

    const linkedinPost = await generateSocialPost("linkedin", episode.title, episode.description || "", fullSummary)
    await sql`
      INSERT INTO summaries (episode_id, summary_type, content)
      VALUES (${episodeId}, 'social_linkedin', ${linkedinPost})
    `

    const instagramPost = await generateSocialPost("instagram", episode.title, episode.description || "", fullSummary)
    await sql`
      INSERT INTO summaries (episode_id, summary_type, content)
      VALUES (${episodeId}, 'social_instagram', ${instagramPost})
    `

    // Generate show notes
    const showNotes = await generateShowNotes(episode.title, episode.description || "", transcript)
    await sql`
      INSERT INTO summaries (episode_id, summary_type, content)
      VALUES (${episodeId}, 'show_notes', ${showNotes})
    `

    // Update status to completed
    await sql`
      UPDATE episodes 
      SET processing_status = 'completed'
      WHERE id = ${episodeId}
    `

    return { success: true }
  } catch (error) {
    console.error("[v0] Summary generation error:", error)

    // Update status to failed
    await sql`
      UPDATE episodes 
      SET processing_status = 'failed'
      WHERE id = ${episodeId}
    `

    return { error: "Failed to generate summaries" }
  }
}

export async function regenerateSummary(summaryId: string) {
  const user = await requireAuth()

  // Verify summary belongs to user's organization
  const summaries = await sql`
    SELECT s.*, e.title as episode_title, e.description as episode_description, e.transcript
    FROM summaries s
    INNER JOIN episodes e ON e.id = s.episode_id
    INNER JOIN podcasts p ON p.id = e.podcast_id
    WHERE s.id = ${summaryId} AND p.organization_id = ${user.organization_id}
    LIMIT 1
  `

  if (summaries.length === 0) {
    return { error: "Summary not found" }
  }

  const summary = summaries[0]

  try {
    let newContent = ""

    switch (summary.summary_type) {
      case "full":
        newContent = await generateEpisodeSummary(
          summary.episode_title,
          summary.episode_description || "",
          summary.transcript,
        )
        break
      case "highlight":
        newContent = await generateHighlights(summary.episode_title, summary.transcript)
        break
      case "social_twitter":
        newContent = await generateSocialPost(
          "twitter",
          summary.episode_title,
          summary.episode_description || "",
          summary.content,
        )
        break
      case "social_linkedin":
        newContent = await generateSocialPost(
          "linkedin",
          summary.episode_title,
          summary.episode_description || "",
          summary.content,
        )
        break
      case "social_instagram":
        newContent = await generateSocialPost(
          "instagram",
          summary.episode_title,
          summary.episode_description || "",
          summary.content,
        )
        break
      case "show_notes":
        newContent = await generateShowNotes(
          summary.episode_title,
          summary.episode_description || "",
          summary.transcript,
        )
        break
    }

    await sql`
      UPDATE summaries 
      SET content = ${newContent}, updated_at = NOW()
      WHERE id = ${summaryId}
    `

    return { success: true, content: newContent }
  } catch (error) {
    console.error("[v0] Regenerate summary error:", error)
    return { error: "Failed to regenerate summary" }
  }
}
