"use client"

export async function trackEvent(
  summaryId: string,
  eventType: "view" | "share" | "click" | "download" | "play" | "complete",
  metadata?: Record<string, any>,
) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summaryId,
        eventType,
        metadata,
      }),
    })
  } catch (error) {
    console.error("[v0] Failed to track event:", error)
  }
}

export function trackPlayback(audio: HTMLAudioElement, summaryId: string) {
  let lastStartedAt: number | null = null

  function flush(eventType: "play" | "complete") {
    if (!audio) return
    let sessionMs = 0
    if (lastStartedAt != null) {
      sessionMs = Math.max(0, Math.round(performance.now() - lastStartedAt))
      lastStartedAt = null
    }
    const durationMs = isFinite(audio.duration) && audio.duration > 0 ? Math.round(audio.duration * 1000) : undefined
    const progressPct = durationMs ? Math.min(100, Math.max(0, (audio.currentTime * 1000 * 100) / durationMs)) : undefined
    // Fire and forget
    trackEvent(summaryId, eventType, {
      session_ms: sessionMs || undefined,
      duration_ms: durationMs,
      progress_pct: progressPct,
    })
  }

  const onPlay = () => {
    if (lastStartedAt == null) lastStartedAt = performance.now()
  }
  const onPause = () => flush("play")
  const onEnded = () => flush("complete")
  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      flush("play")
    }
  }

  audio.addEventListener("play", onPlay)
  audio.addEventListener("pause", onPause)
  audio.addEventListener("ended", onEnded)
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange)
  }

  return function cleanup() {
    audio.removeEventListener("play", onPlay)
    audio.removeEventListener("pause", onPause)
    audio.removeEventListener("ended", onEnded)
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }
}
