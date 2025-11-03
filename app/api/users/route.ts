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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const user = await prisma.users.create({
      data: {
        email: body.email,
        full_name: body.name || body.full_name,
        password_hash: body.password_hash || "temp_hash", // This should be properly hashed in production
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        created_at: true,
        updated_at: true,
      },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}
