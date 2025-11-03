"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { signIn, resendVerificationEmail } from "@/app/actions/auth"
import Link from "next/link"

export function SignInForm() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await signIn(email, password)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!email) return
    setResendMessage("")
    setResendLoading(true)
    const result = await resendVerificationEmail(email)
    if (result?.error) {
      setResendMessage(result.error)
    } else if (result?.success) {
      setResendMessage(result.message || "If an account exists, a verification email has been sent.")
    } else {
      setResendMessage("If an account exists, a verification email has been sent.")
    }
    setResendLoading(false)
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <div>{error}</div>
            {error === "Please verify your email address before signing in" && (
              <div className="mt-2 flex items-center gap-2">
                <Button type="button" size="sm" variant="secondary" disabled={resendLoading || !email} onClick={handleResendVerification}>
                  {resendLoading ? "Sending..." : "Resend verification email"}
                </Button>
                {resendMessage && <span className="text-xs text-muted-foreground">{resendMessage}</span>}
              </div>
            )}
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </Card>
  )
}
