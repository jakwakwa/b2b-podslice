"use server"

import { sql } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function signLicense(data: {
  organizationId: string
  userId: string
  licenseType: "b2b_only" | "b2b_b2c"
  tdmOptOut: boolean
}) {
  const user = await requireAuth()

  // Verify user belongs to organization
  if (user.organization_id !== data.organizationId) {
    return { error: "Unauthorized" }
  }

  // Only admins can sign licenses
  if (user.role !== "admin") {
    return { error: "Only administrators can sign license agreements" }
  }

  try {
    // Deactivate any existing active licenses
    await sql`
      UPDATE licenses 
      SET is_active = false
      WHERE organization_id = ${data.organizationId} AND is_active = true
    `

    // Create new license
    await sql`
      INSERT INTO licenses (
        organization_id,
        license_type,
        terms_version,
        signed_by_user_id,
        tdm_opt_out,
        is_active
      )
      VALUES (
        ${data.organizationId},
        ${data.licenseType},
        'v1.0',
        ${data.userId},
        ${data.tdmOptOut},
        true
      )
    `

    return { success: true }
  } catch (error) {
    console.error("[v0] License signing error:", error)
    return { error: "Failed to sign license agreement" }
  }
}
