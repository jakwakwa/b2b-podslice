"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { calculateRoyalty, getPayoutSchedule } from "@/lib/royalties"

export async function calculateMonthlyRoyalties(organizationId: string, year: number, month: number) {
  const user = await requireAuth()

  if (user.organization_id !== organizationId || user.role !== "admin") {
    return { error: "Unauthorized" }
  }

  const { start, end } = getPayoutSchedule(new Date(year, month - 1, 1))

  try {
    // Get all summaries and their engagement for the period
    const summaries = await sql`
      SELECT s.id, s.view_count, s.share_count
      FROM summaries s
      INNER JOIN episodes e ON e.id = s.episode_id
      INNER JOIN podcasts p ON p.id = e.podcast_id
      WHERE p.organization_id = ${organizationId}
        AND s.created_at >= ${start.toISOString()}
        AND s.created_at <= ${end.toISOString()}
    `

    const totalViews = summaries.reduce((sum, s) => sum + s.view_count, 0)
    const totalShares = summaries.reduce((sum, s) => sum + s.share_count, 0)
    const calculatedAmount = calculateRoyalty(totalViews, totalShares)

    // Check if royalty record already exists
    const existing = await sql`
      SELECT id FROM royalties
      WHERE organization_id = ${organizationId}
        AND period_start = ${start.toISOString()}
        AND period_end = ${end.toISOString()}
      LIMIT 1
    `

    if (existing.length > 0) {
      // Update existing record
      await sql`
        UPDATE royalties
        SET total_views = ${totalViews},
            total_shares = ${totalShares},
            calculated_amount = ${calculatedAmount},
            updated_at = NOW()
        WHERE id = ${existing[0].id}
      `
    } else {
      // Create new royalty record
      const royalties = await sql`
        INSERT INTO royalties (
          organization_id,
          period_start,
          period_end,
          total_views,
          total_shares,
          calculated_amount,
          payment_status
        )
        VALUES (
          ${organizationId},
          ${start.toISOString()},
          ${end.toISOString()},
          ${totalViews},
          ${totalShares},
          ${calculatedAmount},
          ${calculatedAmount >= 10 ? "pending" : "pending"}
        )
        RETURNING id
      `

      // Create line items for each summary
      for (const summary of summaries) {
        const amount = calculateRoyalty(summary.view_count, summary.share_count)
        await sql`
          INSERT INTO royalty_line_items (
            royalty_id,
            summary_id,
            views,
            shares,
            amount
          )
          VALUES (
            ${royalties[0].id},
            ${summary.id},
            ${summary.view_count},
            ${summary.share_count},
            ${amount}
          )
        `
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Calculate royalties error:", error)
    return { error: "Failed to calculate royalties" }
  }
}

export async function processPayment(royaltyId: string) {
  const user = await requireAuth()

  if (user.role !== "admin") {
    return { error: "Unauthorized" }
  }

  try {
    // Verify royalty belongs to user's organization
    const royalties = await sql`
      SELECT * FROM royalties
      WHERE id = ${royaltyId} AND organization_id = ${user.organization_id}
      LIMIT 1
    `

    if (royalties.length === 0) {
      return { error: "Royalty not found" }
    }

    const royalty = royalties[0]

    if (royalty.payment_status === "paid") {
      return { error: "Payment already processed" }
    }

    // In a real implementation, this would integrate with Stripe
    // For demo purposes, we'll simulate the payment
    await sql`
      UPDATE royalties
      SET payment_status = 'processing'
      WHERE id = ${royaltyId}
    `

    // Simulate Stripe payout
    const stripePayoutId = `po_${Date.now()}`

    await sql`
      UPDATE royalties
      SET payment_status = 'paid',
          paid_at = NOW(),
          stripe_payout_id = ${stripePayoutId}
      WHERE id = ${royaltyId}
    `

    return { success: true, payoutId: stripePayoutId }
  } catch (error) {
    console.error("[v0] Process payment error:", error)

    await sql`
      UPDATE royalties
      SET payment_status = 'failed'
      WHERE id = ${royaltyId}
    `

    return { error: "Failed to process payment" }
  }
}
