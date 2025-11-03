"use server"

import prisma from "@/lib/prisma"
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
    await prisma.licenses.updateMany({
      where: {
        organization_id: data.organizationId,
        is_active: true,
      },
      data: {
        is_active: false,
      },
    })

    // Create new license
    await prisma.licenses.create({
      data: {
        organization_id: data.organizationId,
        license_type: data.licenseType,
        terms_version: "v1.0",
        signed_by_user_id: data.userId,
        tdm_opt_out: data.tdmOptOut,
        is_active: true,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] License signing error:", error)
    return { error: "Failed to sign license agreement" }
  }
}
