import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RoyaltyChart } from "@/components/royalty-chart"
import { formatCurrency } from "@/lib/royalties"

export default async function RoyaltiesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const royalties = await prisma.royalties.findMany({
    where: { organization_id: user.organization_id },
    orderBy: { period_start: "desc" },
  })

  // Get current month start date
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Fetch current period stats
  const summaryData = await prisma.summaries.aggregate({
    where: {
      episodes: {
        podcasts: {
          organization_id: user.organization_id,
        },
      },
      created_at: {
        gte: monthStart,
      },
    },
    _sum: {
      view_count: true,
      share_count: true,
    },
  })

  const currentPeriod = {
    total_views: summaryData._sum.view_count || 0,
    total_shares: summaryData._sum.share_count || 0,
  }

  const totalEarnings = royalties
    .filter((r) => r.payment_status === "paid")
    .reduce((sum, r) => sum + Number(r.calculated_amount || 0), 0)

  const pendingEarnings = royalties
    .filter((r) => r.payment_status === "pending")
    .reduce((sum, r) => sum + Number(r.calculated_amount || 0), 0)

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-500",
    processing: "bg-blue-500/10 text-blue-500",
    paid: "bg-green-500/10 text-green-500",
    failed: "bg-red-500/10 text-red-500",
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Royalties & Payments</h1>
          <p className="mt-2 text-muted-foreground">Track your earnings and payment history</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
            <p className="mt-2 text-3xl font-bold">{formatCurrency(totalEarnings)}</p>
            <p className="mt-1 text-sm text-muted-foreground">All-time paid</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Pending Earnings</p>
            <p className="mt-2 text-3xl font-bold">{formatCurrency(pendingEarnings)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Awaiting payout</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Current Period</p>
            <p className="mt-2 text-lg font-semibold">{currentPeriod.total_views} views</p>
            <p className="mt-1 text-lg font-semibold">{currentPeriod.total_shares} shares</p>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="p-6">
            <h2 className="mb-6 text-xl font-semibold">Earnings Over Time</h2>
            <RoyaltyChart royalties={royalties} />
          </Card>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Payment History</h2>
            <Button variant="outline">Download Report</Button>
          </div>

          {royalties.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No payment history yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Royalties are calculated monthly based on content engagement
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {royalties.map((royalty) => (
                <Card key={royalty.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {new Date(royalty.period_start).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={statusColors[royalty.payment_status as keyof typeof statusColors]}
                        >
                          {royalty.payment_status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {new Date(royalty.period_start).toLocaleDateString()} -{" "}
                        {new Date(royalty.period_end).toLocaleDateString()}
                      </p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Views</p>
                          <p className="mt-1 font-medium">{royalty.total_views.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Shares</p>
                          <p className="mt-1 font-medium">{royalty.total_shares.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="mt-1 font-medium">{formatCurrency(Number(royalty.calculated_amount))}</p>
                        </div>
                      </div>
                      {royalty.paid_at && (
                        <p className="mt-4 text-sm text-muted-foreground">
                          Paid on {new Date(royalty.paid_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">How Royalties Work</h2>
          <Card className="p-6">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold">Calculation Method</h3>
              <p className="mt-3 leading-relaxed">
                Royalties are calculated based on engagement with your generated content:
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  <strong>Views:</strong> $0.001 per view
                </li>
                <li>
                  <strong>Shares:</strong> $0.01 per share
                </li>
                <li>
                  <strong>Clicks:</strong> $0.005 per click to original episode
                </li>
              </ul>

              <h3 className="mt-6 text-lg font-semibold">Payment Schedule</h3>
              <p className="mt-3 leading-relaxed">
                Royalties are calculated at the end of each month and paid out within 7 business days. Payments are
                processed through Stripe and sent directly to your connected account.
              </p>

              <h3 className="mt-6 text-lg font-semibold">Minimum Payout</h3>
              <p className="mt-3 leading-relaxed">
                The minimum payout threshold is $10.00. If your earnings for a period are below this amount, they will
                roll over to the next period until the threshold is met.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
