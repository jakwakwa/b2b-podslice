import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-linear-to-b from-background to-background">
            {/* Header */}
            <header className="border-b bg-background backdrop-blur-sm supports-backdrop-filter:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-foreground -foreground font-bold">
                            P
                        </div>
                        <span className="text-xl font-bold">Podslice</span>
                    </div>
                    <nav className="flex items-center gap-4">coming soon</nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-24 text-center">
                <h1 className="text-balance text-5xl font-bold tracking-tight lg:text-6xl">
                    AI-Powered Content for
                    <br />
                    <span className="bg-linear-to-r from-primary-foreground-muted to-sidebar-primary-foreground bg-clip-text text-transparent">
                        Podcast Creators
                    </span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
                    Transform your podcast episodes into summaries, clips, and social content. Built
                    on ethical AI with transparent attribution and fair royalties.
                </p>
                <div className="mt-10 flex items-center justify-center gap-4">
                    <Link href="#features">
                        <Button size="lg" variant="outline" className="text-lg bg-transparent">
                            Learn More
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="container mx-auto px-4 py-24">
                <h2 className="text-center text-3xl font-bold tracking-tight">
                    Everything You Need to Amplify Your Podcast
                </h2>
                <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="p-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-foreground ">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold">AI Summaries</h3>
                        <p className="mt-2 text-muted-foreground leading-relaxed">
                            Generate comprehensive episode summaries, key highlights, and show notes
                            automatically.
                        </p>
                    </Card>

                    <Card className="p-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-foreground ">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Smart Clips</h3>
                        <p className="mt-2 text-muted-foreground leading-relaxed">
                            Extract the best moments from your episodes with AI-powered clip generation.
                        </p>
                    </Card>

                    <Card className="p-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-foreground ">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Social Content</h3>
                        <p className="mt-2 text-muted-foreground leading-relaxed">
                            Create platform-optimized posts for Twitter, LinkedIn, and Instagram
                            instantly.
                        </p>
                    </Card>

                    <Card className="p-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-foreground ">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Ethical Attribution</h3>
                        <p className="mt-2 text-muted-foreground leading-relaxed">
                            Every piece of content includes proper attribution and links back to your
                            original episode.
                        </p>
                    </Card>

                    <Card className="p-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-foreground ">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Royalty Tracking</h3>
                        <p className="mt-2 text-muted-foreground leading-relaxed">
                            Transparent royalty calculations with automated payments through Paddle.
                        </p>
                    </Card>

                    <Card className="p-6">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-foreground ">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold">Performance Analytics</h3>
                        <p className="mt-2 text-muted-foreground leading-relaxed">
                            Track views, shares, and engagement across all your generated content.
                        </p>
                    </Card>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-4 py-24">
                <Card className="bg-primary text-foreground -foreground p-12 text-center">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Ready to Transform Your Podcast Content?
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed opacity-90">
                        Join podcast creators who trust Podslice for ethical, AI-powered content
                        generation.
                    </p>
                    <div className="mt-8">
                        <Link href="/sign-up">
                            <Button size="lg" variant="secondary" className="text-lg">
                                Start Your Free Trial
                            </Button>
                        </Link>
                    </div>
                </Card>
            </section>
        </div>
    );
}
