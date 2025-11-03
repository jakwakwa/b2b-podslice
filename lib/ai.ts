import { generateText } from "ai"

export async function generateEpisodeSummary(
  episodeTitle: string,
  episodeDescription: string,
  transcript: string,
): Promise<string> {
  const { text } = await generateText({
    model: "google/gemini-2.5-flash-image",
    prompt: `You are an expert podcast content summarizer. Create a comprehensive summary of this podcast episode.

Episode Title: ${episodeTitle}
Episode Description: ${episodeDescription}

Transcript:
${transcript}

Create a detailed summary that:
- Captures the main topics and key insights
- Highlights important quotes or moments
- Provides context for listeners who haven't heard the episode
- Is engaging and informative (200-300 words)

Summary:`,
    maxOutputTokens: 500,
  })

  return text
}

export async function generateHighlights(episodeTitle: string, transcript: string): Promise<string> {
  const { text } = await generateText({
    model: "google/gemini-2.5-flash-image",
    prompt: `You are an expert at identifying key moments in podcast episodes. Extract the top 5 highlights from this episode.

Episode Title: ${episodeTitle}

Transcript:
${transcript}

Create a bulleted list of the 5 most interesting, valuable, or memorable moments from this episode. Each highlight should be 1-2 sentences.

Highlights:`,
    maxOutputTokens: 400,
  })

  return text
}

export async function generateSocialPost(
  platform: "twitter" | "linkedin" | "instagram",
  episodeTitle: string,
  episodeDescription: string,
  summary: string,
): Promise<string> {
  const platformGuidelines = {
    twitter: "Create a compelling tweet (max 280 characters) with relevant hashtags. Make it engaging and shareable.",
    linkedin:
      "Create a professional LinkedIn post (150-200 words) that highlights business insights and value. Include relevant hashtags.",
    instagram:
      "Create an Instagram caption (150-200 words) that is engaging and visual. Include relevant hashtags and emojis.",
  }

  const { text } = await generateText({
    model: "google/gemini-2.5-flash-image",
    prompt: `You are a social media expert. Create a ${platform} post to promote this podcast episode.

Episode Title: ${episodeTitle}
Episode Description: ${episodeDescription}

Summary: ${summary}

${platformGuidelines[platform]}

${platform.charAt(0).toUpperCase() + platform.slice(1)} Post:`,
    maxOutputTokens: 300,
  })

  return text
}

export async function generateShowNotes(
  episodeTitle: string,
  episodeDescription: string,
  transcript: string,
): Promise<string> {
  const { text } = await generateText({
    model: "google/gemini-2.5-flash-image",
    prompt: `You are an expert at creating podcast show notes. Generate comprehensive show notes for this episode.

Episode Title: ${episodeTitle}
Episode Description: ${episodeDescription}

Transcript:
${transcript}

Create show notes that include:
- Brief episode overview (2-3 sentences)
- Key topics discussed (bulleted list)
- Notable quotes or insights
- Timestamps for major topics (if identifiable)
- Resources or links mentioned (if any)

Show Notes:`,
    maxOutputTokens: 600,
  })

  return text
}

export async function generateTranscript(audioUrl: string): Promise<string> {
  // In a real implementation, this would use a transcription service
  // For demo purposes, we'll return a placeholder
  return `This is a placeholder transcript for the audio file at ${audioUrl}. 
  
In a production environment, this would be generated using a transcription service like:
- OpenAI Whisper API
- Google Speech-to-Text
- AssemblyAI
- Deepgram

The transcript would contain the full text of the podcast episode, which would then be used to generate summaries, highlights, and social media content.`
}
