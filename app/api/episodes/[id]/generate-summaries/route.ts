import type { NextRequest } from "next/server"
import { redirect } from "next/navigation"
import { generateAllSummaries } from "@/app/actions/summaries"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const result = await generateAllSummaries(id)

    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 })
    }

    redirect(`/dashboard/episodes/${id}`)
  } catch (error) {
    console.error("[v0] Generate summaries API error:", error)
    return Response.json({ error: "Failed to generate summaries" }, { status: 500 })
  }
}
