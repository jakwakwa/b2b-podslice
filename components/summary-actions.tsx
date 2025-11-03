"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { regenerateSummary } from "@/app/actions/summaries"

export function SummaryActions({ summaryId, content }: { summaryId: string; content: string }) {
  const [loading, setLoading] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    // In a real app, show a toast notification
    alert("Copied to clipboard!")
  }

  async function handleRegenerate() {
    if (!confirm("Are you sure you want to regenerate this summary? This will replace the current content.")) {
      return
    }

    setLoading(true)
    const result = await regenerateSummary(summaryId)
    setLoading(false)

    if (result.error) {
      alert(result.error)
    } else {
      window.location.reload()
    }
  }

  function handleDownload() {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `summary-${summaryId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleCopy} variant="outline">
        Copy
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">More</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRegenerate} disabled={loading}>
            {loading ? "Regenerating..." : "Regenerate"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>Download</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
