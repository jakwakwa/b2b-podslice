import { NextRequest, NextResponse } from "next/server"
import prisma from "../../../lib/prisma"

export async function GET(_: NextRequest) {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// ⚠️  SECURITY: POST endpoint removed
// User creation must use the secure signUp() server action in app/actions/auth.ts
// which properly:
// - Hashes passwords with PBKDF2-SHA512
// - Sends email verification tokens
// - Creates organizations and sets roles
// - Prevents unauthenticated account creation
//
// This endpoint was creating users with unhashed passwords ("temp_hash" fallback)
// and bypassing all security controls. Client code should use:
// import { signUp } from "@/app/actions/auth"
// const result = await signUp({ email, password, fullName, organizationName })
