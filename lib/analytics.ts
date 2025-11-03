"use client"

export async function trackEvent(
  summaryId: string,
  eventType: "view" | "share" | "click" | "download",
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
