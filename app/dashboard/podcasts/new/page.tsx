import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { PodcastCreateForm } from "@/components/podcast-create-form";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function NewPodcastPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in");
    }

    return (
        <div className="min-h-screen ">
            <DashboardHeader user={user} />

            <main className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-2xl">
                    <div className="mb-8">
                        <Link
                            href="/dashboard/podcasts"
                            className="text-sm text-muted-foreground hover:text-foreground">
                            ← Back to Podcasts
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold">Create New Podcast</h1>
                    <p className="mt-2 text-muted-foreground">Set up your new podcast show</p>

                    <Card className="mt-8 p-6">
                        <PodcastCreateForm />
                    </Card>
                </div>
            </main>
        </div>
    );
}
