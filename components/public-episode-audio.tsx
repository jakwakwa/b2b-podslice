"use client"

import { useEffect, useRef } from "react"
import { trackPlayback } from "@/lib/analytics"

type PublicEpisodeAudioProps = {
  summaryId: string
  audioUrl: string
}

export function PublicEpisodeAudio({ summaryId, audioUrl }: PublicEpisodeAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const cleanup = trackPlayback(audio, summaryId)
    return cleanup
  }, [summaryId])

  return (
    <div className="mt-6">
      <span className="text-sm font-medium">Listen</span>
      <audio ref={audioRef} controls className="mt-2 w-full">
        <source src={audioUrl} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}


