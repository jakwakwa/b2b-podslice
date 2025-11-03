"use server"

import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function createPodcast(formData: FormData) {
  const user = await requireAuth()

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const author = formData.get("author") as string
  const category = formData.get("category") as string
  const websiteUrl = formData.get("website_url") as string

  if (!title || title.trim().length === 0) {
    return { error: "Podcast title is required" }
  }

  try {
    // Create podcast record using Prisma
    const podcast = await prisma.podcasts.create({
      data: {
        organization_id: user.organization_id,
        title,
        description: description || null,
        author: author || null,
        category: category || null,
        website_url: websiteUrl || null,
        is_active: true,
      },
    })

    redirect(`/dashboard/podcasts/${podcast.id}`)
  } catch (error) {
    console.error("Failed to create podcast:", error)
    return { error: "Failed to create podcast. Please try again." }
  }
}
