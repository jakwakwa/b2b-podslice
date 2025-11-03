import "dotenv/config"
import prisma from "../lib/prisma"

async function testDatabase() {
  console.log("🔍 Testing Prisma Postgres connection...\n")

  try {
    // Test 1: Check connection
    console.log("✅ Connected to database!")

    // Test 2: Create a test user
    console.log("\n📝 Creating a test user...")
    const newUser = await prisma.users.create({
      data: {
        email: `demo-${Date.now()}@example.com`,
        full_name: "Demo User",
        password_hash: "temp_hash_for_testing",
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        created_at: true,
      },
    })
    console.log("✅ Created user:", newUser)

    // Test 3: Fetch all users
    console.log("\n📋 Fetching all users...")
    const allUsers = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
      },
    })
    console.log(`✅ Found ${allUsers.length} user(s):`)
    allUsers.slice(-5).forEach((user) => {
      console.log(`   - ${user.full_name} (${user.email})`)
    })

    console.log("\n🎉 All tests passed! Your database is working perfectly.\n")
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

testDatabase()
