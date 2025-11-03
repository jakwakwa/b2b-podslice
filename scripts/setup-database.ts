import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"
import { join } from "path"

const sql = neon(process.env.NEON_NEON_DATABASE_URL!)

async function setupDatabase() {
  console.log("[v0] Starting database setup...")

  try {
    const sqlFiles = ["001-create-tables.sql"]

    for (const file of sqlFiles) {
      console.log(`[v0] Executing ${file}...`)
      const sqlContent = readFileSync(join(__dirname, file), "utf-8")

      // Split by semicolon and execute each statement
      const statements = sqlContent
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"))

      for (const statement of statements) {
        await sql(statement)
      }

      console.log(`[v0] ✓ ${file} completed`)
    }

    console.log("[v0] Database setup completed successfully!")

    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log("[v0] Created tables:", tables.map((t) => t.table_name).join(", "))
  } catch (error) {
    console.error("[v0] Database setup failed:", error)
    throw error
  }
}

setupDatabase()
