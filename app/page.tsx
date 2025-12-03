"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { joinWaitingList } from "@/app/actions/waiting-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HomePage() {
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();

    if (e.target.name === "email") {
      setEmailInput(e.target.value);
    } else if (e.target.name === "name") {
      setNameInput(e.target.value);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic client-side validation
    if (!emailInput.trim()) {
      toast.error("Email is required", {
        description:
          "Please enter your email address to join the waiting list.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      toast.error("Invalid email address", {
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await joinWaitingList({
        email: emailInput.trim(),
        ...(nameInput.trim() && { name: nameInput.trim() }),
      });

      if (response.error) {
        toast.error("Failed to join waiting list", {
          description: response.error,
        });
      } else {
        toast.success("Successfully joined!", {
          description:
            response.message || "You've been added to the waiting list.",
        });
        // Reset form inputs
        setEmailInput("");
        setNameInput("");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again later.";
      toast.error("Something went wrong", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b  backdrop-blur-2xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-foreground -foreground font-bold">
              P
            </div>
            <span className="text-xl font-bold">PODSLICE.Ai Studio</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in">Sign In</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-balance text-5xl font-bold tracking-tight lg:text-6xl">
          AI-Powered Content for
          <br />
          <span className="bg-linear-to-r from-purple-500 to-teal-200 bg-clip-text text-transparent">
            Podcast Creators
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
          Transform your podcast episodes into summaries, clips, and social
          content. Built on ethical AI with transparent attribution and fair
          royalties.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-4">
            <Link href="#features">
              <Button
                size="lg"
                variant="outline"
                className="text-lg bg-transparent"
              >
                Learn More
              </Button>
            </Link>
          </div>
          <Card className="w-full max-w-md p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={emailInput}
                  onChange={handleOnChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={nameInput}
                  onChange={handleOnChange}
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Joining..." : "Join Waiting List"}
              </Button>
            </form>
          </Card>
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
                viewBox="0 0 24 24"
              >
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
              Generate comprehensive episode summaries, key highlights, and show
              notes automatically.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-foreground ">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              Extract the best moments from your episodes with AI-powered clip
              generation.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-foreground ">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              Create platform-optimized posts for Twitter, LinkedIn, and
              Instagram instantly.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-foreground ">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              Every piece of content includes proper attribution and links back
              to your original episode.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-foreground ">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              Transparent royalty calculations with automated payments through
              Paddle.
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-foreground ">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
              Track views, shares, and engagement across all your generated
              content.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="bg-violet-500/50 text-foreground -foreground p-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to Transform Your Podcast Content?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed opacity-90">
            Comiong soon! Subscribe to our waiting list for upcoming
            announcements and news
          </p>
        </Card>
      </section>
    </div>
  );
}
