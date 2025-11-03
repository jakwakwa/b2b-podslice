"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { generateAllSummaries } from "@/app/actions/summaries"

export function GenerateSummariesButton({ episodeId }: { episodeId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    const result = await generateAllSummaries(episodeId)

    if (result.error) {
      alert(result.error)
      setLoading(false)
    } else {
      window.location.reload()
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={loading} className="w-full">
      {loading ? "Generating..." : "Generate Summaries"}
    </Button>
  )
}
