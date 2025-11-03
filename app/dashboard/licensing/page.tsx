import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LicenseForm } from "@/components/license-form"

export default async function LicensingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const licenses = await sql`
    SELECT l.*, u.full_name as signed_by_name
    FROM licenses l
    LEFT JOIN users u ON u.id = l.signed_by_user_id
    WHERE l.organization_id = ${user.organization_id}
    ORDER BY l.created_at DESC
  `

  const activeLicense = licenses.find((l) => l.is_active)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Licensing & Attribution</h1>
          <p className="mt-2 text-muted-foreground">Manage your content licensing and attribution settings</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Current License</h2>
            {activeLicense ? (
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {activeLicense.license_type === "b2b_only" ? "B2B Only" : "B2B + B2C"}
                      </h3>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                        Active
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Signed on {new Date(activeLicense.signed_at).toLocaleDateString()}
                    </p>
                    {activeLicense.signed_by_name && (
                      <p className="mt-1 text-sm text-muted-foreground">by {activeLicense.signed_by_name}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium">License Type</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeLicense.license_type === "b2b_only"
                        ? "Your content is licensed for B2B use only. Generated summaries are private to your organization."
                        : "Your content is licensed for both B2B and B2C use. Generated summaries may appear on the public Podslice platform."}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium">TDM Opt-Out (EU)</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeLicense.tdm_opt_out
                        ? "You have opted out of text and data mining under EU regulations."
                        : "You have not opted out of text and data mining."}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium">Terms Version</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{activeLicense.terms_version}</p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No active license</p>
                <p className="mt-2 text-sm text-muted-foreground">Sign a license agreement to start using Podslice</p>
              </Card>
            )}

            {licenses.length > 1 && (
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold">License History</h3>
                <div className="space-y-3">
                  {licenses
                    .filter((l) => !l.is_active)
                    .map((license) => (
                      <Card key={license.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {license.license_type === "b2b_only" ? "B2B Only" : "B2B + B2C"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(license.signed_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary">Inactive</Badge>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-semibold">
              {activeLicense ? "Update License" : "Sign License Agreement"}
            </h2>
            <LicenseForm organizationId={user.organization_id} userId={user.id} currentLicense={activeLicense} />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="mb-4 text-2xl font-semibold">Attribution Guidelines</h2>
          <Card className="p-6">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="leading-relaxed">
                All content generated by Podslice includes automatic attribution to ensure ethical use and proper credit
                to content creators.
              </p>

              <h3 className="mt-6 text-lg font-semibold">What's Included in Attribution</h3>
              <ul className="mt-3 space-y-2">
                <li>Direct link to the original podcast episode</li>
                <li>Podcast name and episode title</li>
                <li>Creator name and branding</li>
                <li>"Generated by Podslice" watermark</li>
                <li>Timestamp of content generation</li>
              </ul>

              <h3 className="mt-6 text-lg font-semibold">Attribution Requirements</h3>
              <ul className="mt-3 space-y-2">
                <li>Attribution cannot be removed from generated content</li>
                <li>Links must remain functional and unmodified</li>
                <li>Creator branding must be displayed as provided</li>
                <li>Any sharing of content must include full attribution</li>
              </ul>

              <h3 className="mt-6 text-lg font-semibold">Royalty Tracking</h3>
              <p className="mt-3 leading-relaxed">
                All views, shares, and engagement with your generated content are tracked automatically. Royalties are
                calculated based on usage and paid out monthly through Stripe.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
