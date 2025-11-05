import prisma from "../lib/prisma"

async function verifyMigration() {
  try {
    // Fetch an episode to check if new fields exist
    const episode = await prisma.episodes.findFirst({
      select: {
        id: true,
        title: true,
        podcast_cover: true,
        podcast_title: true,
        summary_count: true,
        podcasts: {
          select: {
            title: true,
            cover_image_url: true,
          },
        },
      },
    })

    if (episode) {
      console.log("✅ Migration successful!")
      console.log("\nSample Episode:")
      console.log(`  Title: ${episode.title}`)
      console.log(`  Podcast Title (denormalized): ${episode.podcast_title}`)
      console.log(`  Podcast Title (from relation): ${episode.podcasts.title}`)
      console.log(`  Podcast Cover (denormalized): ${episode.podcast_cover}`)
      console.log(`  Podcast Cover (from relation): ${episode.podcasts.cover_image_url}`)
      console.log(`  Summary Count: ${episode.summary_count}`)

      const match = episode.podcast_title === episode.podcasts.title
      console.log(`\n  Data consistency: ${match ? "✅ MATCH" : "❌ MISMATCH"}`)
    } else {
      console.log("No episodes found")
    }

    // Count episodes with populated fields
    const totalEpisodes = await prisma.episodes.count()
    const episodesWithPodcastTitle = await prisma.episodes.count({
      where: { podcast_title: { not: null } },
    })

    console.log(`\nTotal episodes: ${totalEpisodes}`)
    console.log(`Episodes with podcast_title: ${episodesWithPodcastTitle}`)
    console.log(`Coverage: ${((episodesWithPodcastTitle / totalEpisodes) * 100).toFixed(1)}%`)
  } catch (error) {
    console.error("❌ Verification error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyMigration()


