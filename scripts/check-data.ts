import prisma from "../lib/prisma"

async function checkData() {
  try {
    const royaltiesCount = await prisma.royalties.count()
    const summariesCount = await prisma.summaries.count()
    const orgsCount = await prisma.organizations.count()
    const podcastsCount = await prisma.podcasts.count()
    const episodesCount = await prisma.episodes.count()

    console.log("Database Data:")
    console.log(`- Organizations: ${orgsCount}`)
    console.log(`- Podcasts: ${podcastsCount}`)
    console.log(`- Episodes: ${episodesCount}`)
    console.log(`- Summaries: ${summariesCount}`)
    console.log(`- Royalties: ${royaltiesCount}`)

    if (royaltiesCount > 0) {
      const sampleRoyalty = await prisma.royalties.findFirst({
        select: {
          calculated_amount: true,
          total_views: true,
          total_shares: true,
        },
      })
      console.log("\nSample Royalty:", sampleRoyalty)
    }
  } catch (error) {
    console.error("Error checking data:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()


