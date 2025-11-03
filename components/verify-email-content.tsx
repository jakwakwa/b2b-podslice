"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyEmail } from "@/app/actions/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error")
        setMessage("Invalid verification link")
        return
      }

      const result = await verifyEmail(token)

      if (result.success) {
        setStatus("success")
        setMessage("Your email has been verified successfully!")
      } else {
        setStatus("error")
        setMessage(result.error || "Verification failed")
      }
    }

    verify()
  }, [token])

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>
          {status === "loading" && "Verifying your email address..."}
          {status === "success" && "Verification complete"}
          {status === "error" && "Verification failed"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <p className="text-center text-muted-foreground">{message}</p>
            <Button onClick={() => router.push("/sign-in")} className="w-full">
              Sign In
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-600" />
            <p className="text-center text-muted-foreground">{message}</p>
            <Button onClick={() => router.push("/sign-up")} variant="outline" className="w-full">
              Back to Sign Up
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
