import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  const organizations = await sql`
    SELECT * FROM organizations 
    WHERE id = ${user.organization_id}
    LIMIT 1
  `

  const organization = organizations[0]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">Manage your account and organization settings</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Organization Profile</h2>
            <Card className="p-6">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org_name">Organization Name</Label>
                  <Input id="org_name" defaultValue={organization.name} placeholder="My Podcast Network" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    defaultValue={organization.website || ""}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    defaultValue={organization.logo_url || ""}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </Card>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-semibold">User Profile</h2>
            <Card className="p-6">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" defaultValue={user.full_name} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user.email} placeholder="you@example.com" disabled />
                  <p className="text-sm text-muted-foreground">Contact support to change your email</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={user.role} disabled />
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-semibold">Danger Zone</h2>
          <Card className="border-destructive p-6">
            <h3 className="font-semibold">Delete Organization</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Permanently delete your organization and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive" className="mt-4">
              Delete Organization
            </Button>
          </Card>
        </div>
      </main>
    </div>
  )
}
