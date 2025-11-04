import "dotenv/config";
import type { PrismaClient } from "../app/generated/prisma/client";
import prisma from "../lib/prisma";

/**
 * Hash password using PBKDF2 (matches auth.ts implementation)
 */
async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const passwordData = encoder.encode(password);

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		passwordData,
		"PBKDF2",
		false,
		["deriveBits"]
	);

	const hash = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: 100000,
			hash: "SHA-512",
		},
		keyMaterial,
		512
	);

	const saltHex = Array.from(salt)
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");
	const hashHex = Array.from(new Uint8Array(hash))
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");

	return `${saltHex}:${hashHex}`;
}

async function main() {
	console.log("🌱 Starting database seed...\n");
	const db = prisma as unknown as PrismaClient;

	// Clean existing data (optional - comment out if you want to preserve data)
	console.log("🧹 Cleaning existing data...");
	await prisma.daily_analytics.deleteMany();
	await prisma.analytics_events.deleteMany();
	await prisma.royalty_line_items.deleteMany();
	await prisma.summaries.deleteMany();
	await prisma.clips.deleteMany();
	await prisma.episodes.deleteMany();
	await prisma.podcasts.deleteMany();
	await prisma.licenses.deleteMany();
	await prisma.royalties.deleteMany();
	await prisma.password_reset_tokens.deleteMany();
	await prisma.email_verification_tokens.deleteMany();
	await prisma.sessions.deleteMany();
	await prisma.users.deleteMany();
	await prisma.organizations.deleteMany();
	console.log("✅ Cleaned\n");

	// Create demo organization
	console.log("📦 Creating organization...");
	const organization = await prisma.organizations.create({
		data: {
			name: "Demo Podcast Network",
			slug: "demo-network",
			website: "https://demo-network.com",
			payout_status: "PENDING",
			tax_form_status: "NONE",
		},
	});
	console.log(`✅ Created organization: ${organization.name}\n`);

	// Create users with proper password hashing
	console.log("👥 Creating users...");
	const passwordHash = await hashPassword("password123");

	// Using email aliases to send all test emails to the same address
	// Gmail example: yourname+admin@gmail.com, yourname+creator@gmail.com
	// Create test users with @demo.com emails
	// If TEST_EMAIL is set in .env, any emails to @demo.com will be redirected there
	const adminUser = await prisma.users.create({
		data: {
			email: "admin@demo.com",
			full_name: "Admin User",
			password_hash: passwordHash,
			role: "admin",
			organization_id: organization.id,
			email_verified: true,
			email_verified_at: new Date(),
		},
	});

	const creatorUser = await prisma.users.create({
		data: {
			email: "creator@demo.com",
			full_name: "Creator User",
			password_hash: passwordHash,
			role: "creator",
			organization_id: organization.id,
			email_verified: true,
			email_verified_at: new Date(),
		},
	});

	const viewerUser = await prisma.users.create({
		data: {
			email: "viewer@demo.com",
			full_name: "Viewer User",
			password_hash: passwordHash,
			role: "viewer",
			organization_id: organization.id,
			email_verified: true,
			email_verified_at: new Date(),
		},
	});

	console.log(`✅ Created users (password for all: password123)`);
	console.log(`   - ${adminUser.email} (admin)`);
	console.log(`   - ${creatorUser.email} (creator)`);
	console.log(`   - ${viewerUser.email} (viewer)\n`);

	// Create license agreement
	console.log("📜 Creating license...");
	await prisma.licenses.create({
		data: {
			organization_id: organization.id,
			license_type: "b2b_b2c",
			terms_version: "v1.0",
			signed_by_user_id: adminUser.id,
			is_active: true,
			tdm_opt_out: false,
		},
	});
	console.log("✅ Created B2B+B2C license\n");

	// Create podcasts
	console.log("🎙️ Creating podcasts...");
	const techPodcast = await prisma.podcasts.create({
		data: {
			organization_id: organization.id,
			title: "Tech Talk Daily",
			description: "Your daily dose of technology news and insights",
			author: "Tech Team",
			category: "Technology",
			language: "en",
			is_active: true,
		},
	});

	const businessPodcast = await prisma.podcasts.create({
		data: {
			organization_id: organization.id,
			title: "Business Insights",
			description: "Deep dives into business strategy and entrepreneurship",
			author: "Business Team",
			category: "Business",
			language: "en",
			is_active: true,
		},
	});

	console.log(`✅ Created podcasts:`);
	console.log(`   - ${techPodcast.title}`);
	console.log(`   - ${businessPodcast.title}\n`);

	// Create episodes
	console.log("📻 Creating episodes...");
	const sampleAudioUrl =
		"https://bqjcw6kqyirbs1sx.public.blob.vercel-storage.com/seed-data/sample-episode.mp3";

	const episode1 = await prisma.episodes.create({
		data: {
			podcast_id: techPodcast.id,
			title: "The Future of AI in 2025",
			description:
				"Exploring the latest developments in artificial intelligence and machine learning",
			audio_url: sampleAudioUrl,
			duration_seconds: 3600,
			file_size_bytes: BigInt(85000000),
			episode_number: 1,
			season_number: 1,
			processing_status: "completed",
			published_at: new Date("2025-01-15"),
			transcript:
				"Welcome to Tech Talk Daily. Today we're discussing the future of AI in 2025...",
		},
	});

	const episode2 = await prisma.episodes.create({
		data: {
			podcast_id: techPodcast.id,
			title: "Cloud Computing Trends",
			description:
				"What every developer needs to know about cloud infrastructure in 2025",
			audio_url: sampleAudioUrl,
			duration_seconds: 2700,
			file_size_bytes: BigInt(64000000),
			episode_number: 2,
			season_number: 1,
			processing_status: "completed",
			published_at: new Date("2025-01-22"),
			transcript: "Cloud computing continues to evolve at a rapid pace...",
		},
	});

	const episode3 = await prisma.episodes.create({
		data: {
			podcast_id: businessPodcast.id,
			title: "Startup Funding Strategies",
			description: "How to raise capital for your startup in 2025",
			audio_url: sampleAudioUrl,
			duration_seconds: 4200,
			file_size_bytes: BigInt(98000000),
			episode_number: 1,
			season_number: 1,
			processing_status: "completed",
			published_at: new Date("2025-01-20"),
			transcript: "Raising capital is one of the biggest challenges for startups...",
		},
	});

	console.log(`✅ Created ${3} episodes\n`);

	// Create summaries
	console.log("📝 Creating AI summaries...");
	const summaries = await Promise.all([
		// Episode 1 summaries
		prisma.summaries.create({
			data: {
				episode_id: episode1.id,
				summary_type: "full",
				content:
					"This episode explores the cutting-edge developments in AI technology for 2025, including advances in large language models, computer vision, and autonomous systems. Key topics include ethical considerations, regulatory frameworks, and practical applications across industries. Experts discuss how AI is transforming healthcare, finance, and education, while addressing concerns about job displacement and privacy.",
				view_count: 1250,
				share_count: 45,
			},
		}),
		prisma.summaries.create({
			data: {
				episode_id: episode1.id,
				summary_type: "highlight",
				content:
					"🔥 Key Highlights:\n• LLMs reaching new capabilities in reasoning\n• Computer vision breakthroughs in medical diagnosis\n• Ethical AI frameworks gaining traction\n• Industry adoption accelerating across sectors",
				view_count: 320,
				share_count: 78,
			},
		}),
		prisma.summaries.create({
			data: {
				episode_id: episode1.id,
				summary_type: "social_twitter",
				content:
					"🤖 Just dropped: The Future of AI in 2025! Exploring LLMs, computer vision, and what it means for your business. Listen now! #AI #Technology #Podcast",
				view_count: 89,
				share_count: 156,
			},
		}),
		prisma.summaries.create({
			data: {
				episode_id: episode1.id,
				summary_type: "show_notes",
				content:
					"Episode Notes:\n\n00:00 - Introduction\n05:30 - Large Language Models Update\n15:45 - Computer Vision Breakthroughs\n28:10 - Ethical Considerations\n42:20 - Industry Applications\n55:00 - Q&A\n\nLinks mentioned:\n- AI Ethics Framework: https://example.com/ai-ethics\n- Research Paper: https://example.com/research",
				view_count: 445,
				share_count: 23,
			},
		}),

		// Episode 2 summaries
		prisma.summaries.create({
			data: {
				episode_id: episode2.id,
				summary_type: "full",
				content:
					"A comprehensive guide to cloud computing trends for 2025, covering serverless architecture, edge computing, multi-cloud strategies, and cost optimization techniques. Perfect for developers and CTOs planning their infrastructure roadmap. Learn about the latest tools, best practices, and real-world case studies from leading tech companies.",
				view_count: 890,
				share_count: 32,
			},
		}),
		prisma.summaries.create({
			data: {
				episode_id: episode2.id,
				summary_type: "social_linkedin",
				content:
					"☁️ New episode alert! Cloud Computing Trends 2025 - Essential insights on serverless, edge computing, and multi-cloud strategies for modern infrastructure teams. #CloudComputing #DevOps #Technology",
				view_count: 156,
				share_count: 67,
			},
		}),

		// Episode 3 summaries
		prisma.summaries.create({
			data: {
				episode_id: episode3.id,
				summary_type: "full",
				content:
					"Learn proven strategies for raising startup capital, from angel investors to venture capital. This episode covers pitch deck essentials, valuation negotiations, term sheets, and common mistakes to avoid when seeking funding. Featuring insights from successful founders and active investors in the startup ecosystem.",
				view_count: 1450,
				share_count: 67,
			},
		}),
		prisma.summaries.create({
			data: {
				episode_id: episode3.id,
				summary_type: "social_twitter",
				content:
					"💰 Startup funding decoded! Learn how to raise capital from angels to VCs. Pitch decks, valuations, term sheets & more. Essential listening for founders! #Startups #Fundraising #Entrepreneurship",
				view_count: 234,
				share_count: 98,
			},
		}),
	]);

	console.log(`✅ Created ${summaries.length} AI-generated summaries\n`);

	// Create analytics events - distributed over last 30 days
	console.log("📊 Creating analytics events...");
	const analyticsPromises = summaries.flatMap(summary => {
		const events = [];
		const viewCount = summary.view_count || 0;
		const shareCount = summary.share_count || 0;
		const baseNow = Date.now();

		// Create more realistic event distribution
		// Spread 20% of views as actual events (for better chart visualization)
		const viewEventsToCreate = Math.min(Math.floor(viewCount * 0.2), 50);
		const shareEventsToCreate = Math.min(Math.floor(shareCount * 0.3), 20);
		const playEventsToCreate = Math.min(Math.floor(viewCount * 0.15), 30);
		const completeEventsToCreate = Math.floor(playEventsToCreate * 0.5);

		// Create view events
		for (let i = 0; i < viewEventsToCreate; i++) {
			events.push(
				prisma.analytics_events.create({
					data: {
						summary_id: summary.id,
						event_type: "view",
						metadata: { source: i % 3 === 0 ? "social" : i % 3 === 1 ? "search" : "web" },
						created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
					},
				})
			);
		}

		// Create share events
		for (let i = 0; i < shareEventsToCreate; i++) {
			events.push(
				prisma.analytics_events.create({
					data: {
						summary_id: summary.id,
						event_type: "share",
						metadata: { platform: i % 2 === 0 ? "twitter" : "linkedin" },
						created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
					},
				})
			);
		}

		// Create some click events
		const clickEventsToCreate = Math.min(Math.floor(viewCount * 0.1), 15);
		for (let i = 0; i < clickEventsToCreate; i++) {
			events.push(
				prisma.analytics_events.create({
					data: {
						summary_id: summary.id,
						event_type: "click",
						metadata: { destination: "episode_page" },
						created_at: new Date(baseNow - Math.random() * 30 * 24 * 60 * 60 * 1000),
					},
				})
			);
		}

		// Create playback events (play/complete)
		for (let i = 0; i < playEventsToCreate; i++) {
			const sessionMs = 30_000 + Math.floor(Math.random() * 180_000); // 30s - 3.5m
			events.push(
				prisma.analytics_events.create({
					data: {
						summary_id: summary.id,
						event_type: "play",
						metadata: { player: "web" },
						duration_ms: sessionMs,
						created_at: new Date(baseNow - Math.random() * 30 * 24 * 60 * 60 * 1000),
					},
				})
			);
		}
		for (let i = 0; i < completeEventsToCreate; i++) {
			const sessionMs = 60_000 + Math.floor(Math.random() * 240_000);
			events.push(
				prisma.analytics_events.create({
					data: {
						summary_id: summary.id,
						event_type: "complete",
						metadata: { player: "web" },
						duration_ms: sessionMs,
						created_at: new Date(baseNow - Math.random() * 30 * 24 * 60 * 60 * 1000),
					},
				})
			);
		}

		return events;
	});

	await Promise.all(analyticsPromises);
	console.log(`✅ Created ${analyticsPromises.length} analytics events\n`);

	// Aggregate into daily_analytics for fast dashboard queries
	console.log("🧮 Aggregating daily analytics...");
	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const events = await db.analytics_events.findMany({
		where: {
			created_at: { gte: thirtyDaysAgo },
			summaries: { episodes: { podcasts: { organization_id: organization.id } } },
		},
		select: { summary_id: true, event_type: true, created_at: true, duration_ms: true },
		orderBy: { created_at: "asc" },
	});

	const agg = new Map<
		string,
		{
			summary_id: string;
			day: Date;
			views: number;
			shares: number;
			clicks: number;
			plays: number;
			completes: number;
			listen_ms_total: number;
		}
	>();
	for (const e of events) {
		const d = e.created_at ? new Date(e.created_at) : new Date();
		const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
		const key = `${e.summary_id}:${day.toISOString()}`;
		if (!agg.has(key)) {
			agg.set(key, {
				summary_id: e.summary_id,
				day,
				views: 0,
				shares: 0,
				clicks: 0,
				plays: 0,
				completes: 0,
				listen_ms_total: 0,
			});
		}
		const a = agg.get(key)!;
		if (e.event_type === "view") a.views += 1;
		else if (e.event_type === "share") a.shares += 1;
		else if (e.event_type === "click" || e.event_type === "download") a.clicks += 1;
		else if (e.event_type === "play") a.plays += 1;
		else if (e.event_type === "complete") a.completes += 1;
		if (e.duration_ms) a.listen_ms_total += e.duration_ms;
	}

	for (const row of agg.values()) {
		const completion_rate = row.plays > 0 ? row.completes / row.plays : 0;
		await prisma.daily_analytics.upsert({
			where: { summary_id_day: { summary_id: row.summary_id, day: row.day } },
			create: {
				summary_id: row.summary_id,
				day: row.day,
				views: row.views,
				shares: row.shares,
				clicks: row.clicks,
				plays: row.plays,
				completes: row.completes,
				listen_ms_total: row.listen_ms_total,
				completion_rate,
			},
			update: {
				views: row.views,
				shares: row.shares,
				clicks: row.clicks,
				plays: row.plays,
				completes: row.completes,
				listen_ms_total: row.listen_ms_total,
				completion_rate,
			},
		});
	}
	console.log(`✅ Aggregated ${agg.size} daily rows\n`);

	// Create royalties for last month
	console.log("💰 Creating royalty records...");
	const lastMonth = new Date();
	lastMonth.setMonth(lastMonth.getMonth() - 1);
	const periodStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
	const periodEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

	const totalViews = summaries.reduce((sum, s) => sum + (s.view_count || 0), 0);
	const totalShares = summaries.reduce((sum, s) => sum + (s.share_count || 0), 0);
	const calculatedAmount = totalViews * 0.001 + totalShares * 0.01;

	const royalty = await prisma.royalties.create({
		data: {
			organization_id: organization.id,
			period_start: periodStart,
			period_end: periodEnd,
			total_views: totalViews,
			total_shares: totalShares,
			calculated_amount: calculatedAmount,
			payment_status: "pending",
		},
	});

	// Create line items
	for (const summary of summaries) {
		const amount = (summary.view_count || 0) * 0.001 + (summary.share_count || 0) * 0.01;
		await prisma.royalty_line_items.create({
			data: {
				royalty_id: royalty.id,
				summary_id: summary.id,
				views: summary.view_count || 0,
				shares: summary.share_count || 0,
				amount: amount,
			},
		});
	}

	console.log(`✅ Created royalty record: $${calculatedAmount.toFixed(2)}\n`);

	// Summary
	console.log("🎉 Seed completed successfully!\n");
	console.log("📊 Summary:");
	console.log(`   • 1 organization`);
	console.log(`   • 3 users (admin, creator, viewer)`);
	console.log(`   • 1 license agreement`);
	console.log(`   • 2 podcasts`);
	console.log(`   • 3 episodes`);
	console.log(`   • ${summaries.length} AI summaries`);
	console.log(
		`   • ~${analyticsPromises.length} analytics events (views, shares, clicks)`
	);
	console.log(`   • 1 royalty record with line items`);
	console.log("\n✅ You can now sign in with:");
	console.log("   📧 admin@demo.com");
	console.log("   🔑 password123\n");
}

main()
	.catch(e => {
		console.error("❌ Seed failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
