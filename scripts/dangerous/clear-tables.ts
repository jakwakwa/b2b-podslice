import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

async function clearAllData() {
	console.log("Clearing all data from database...");

	try {
		// Clear tables in dependency order
		await sql`TRUNCATE TABLE analytics_events CASCADE`;
		await sql`TRUNCATE TABLE royalty_line_items CASCADE`;
		await sql`TRUNCATE TABLE summaries CASCADE`;
		await sql`TRUNCATE TABLE clips CASCADE`;
		await sql`TRUNCATE TABLE episodes CASCADE`;
		await sql`TRUNCATE TABLE podcasts CASCADE`;
		await sql`TRUNCATE TABLE licenses CASCADE`;
		await sql`TRUNCATE TABLE royalties CASCADE`;
		await sql`TRUNCATE TABLE password_reset_tokens CASCADE`;
		await sql`TRUNCATE TABLE email_verification_tokens CASCADE`;
		await sql`TRUNCATE TABLE sessions CASCADE`;
		await sql`TRUNCATE TABLE users CASCADE`;
		await sql`TRUNCATE TABLE organizations CASCADE`;

		console.log("✅ All data cleared successfully!");
	} catch (error) {
		console.error("❌ Error clearing data:", error);
		throw error;
	}
}

clearAllData();
