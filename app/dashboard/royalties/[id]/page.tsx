import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatCurrency } from "@/lib/royalties"

export default async function RoyaltyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const royalties = await sql`
    SELECT * FROM royalties
    WHERE id = ${id} AND organization_id = ${user.organization_id}
    LIMIT 1
  `

  if (royalties.length === 0) {
    redirect("/dashboard/royalties")
  }

  const royalty = royalties[0]

  const lineItems = await sql`
    SELECT rli.*, s.summary_type, s.content, e.title as episode_title
    FROM royalty_line_items rli
    INNER JOIN summaries s ON s.id = rli.summary_id
    INNER JOIN episodes e ON e.id = s.episode_id
    WHERE rli.royalty_id = ${id}
    ORDER BY rli.amount DESC
  `

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-500",
    processing: "bg-blue-500/10 text-blue-500",
    paid: "bg-green-500/10 text-green-500",
    failed: "bg-red-500/10 text-red-500",
  }

  const typeLabels: Record<string, string> = {
    full: "Full Summary",
    highlight: "Highlights",
    social_twitter: "Twitter",
    social_linkedin: "LinkedIn",
    social_instagram: "Instagram",
    show_notes: "Show Notes",
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard/royalties" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Royalties
          </Link>
        </div>

        <Card className="mb-8 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">
                  {new Date(royalty.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h1>
                <Badge
                  variant="secondary"
                  className={statusColors[royalty.payment_status as keyof typeof statusColors]}
                >
                  {royalty.payment_status}
                </Badge>
              </div>
              <p className="mt-2 text-muted-foreground">
                {new Date(royalty.period_start).toLocaleDateString()} -{" "}
                {new Date(royalty.period_end).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="mt-1 text-3xl font-bold">{formatCurrency(Number(royalty.calculated_amount))}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="mt-1 text-2xl font-semibold">{royalty.total_views.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Shares</p>
              <p className="mt-1 text-2xl font-semibold">{royalty.total_shares.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Content Pieces</p>
              <p className="mt-1 text-2xl font-semibold">{lineItems.length}</p>
            </div>
          </div>

          {royalty.paid_at && (
            <div className="mt-6 border-t pt-6">
              <p className="text-sm text-muted-foreground">Paid on {new Date(royalty.paid_at).toLocaleDateString()}</p>
              {royalty.stripe_payout_id && (
                <p className="mt-1 text-sm text-muted-foreground">Payout ID: {royalty.stripe_payout_id}</p>
              )}
            </div>
          )}
        </Card>

        <div>
          <h2 className="mb-4 text-2xl font-semibold">Breakdown by Content</h2>
          <div className="space-y-4">
            {lineItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{typeLabels[item.summary_type] || item.summary_type}</Badge>
                      <h3 className="font-semibold">{item.episode_title}</h3>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-1">{item.content}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{item.views} views</span>
                      <span>{item.shares} shares</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-semibold">{formatCurrency(Number(item.amount))}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
