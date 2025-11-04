"use server"

// Email utility for sending verification and reset emails
// In production, integrate with services like Resend, SendGrid, or AWS SES

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}`

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || "Podslice <noreply@podslice.ai>"
  
  // Redirect test emails to a real address to prevent bounces
  const testEmailRedirect = process.env.TEST_EMAIL
  const actualRecipient = testEmailRedirect && email.endsWith("@demo.com") 
    ? testEmailRedirect 
    : email

  try {
    if (!apiKey) {
      console.warn("[v0] RESEND_API_KEY not set; logging verification link instead.")
      console.log(`[v0] Verification email for ${email} (would send to: ${actualRecipient}):`)
      console.log(`[v0] Verification URL: ${verificationUrl}`)
      return { success: true }
    }

    const { Resend } = await import("resend")
    const resend = new Resend(apiKey)

    await resend.emails.send({
      from,
      to: actualRecipient,
      subject: "Verify your email address",
      html: `
        <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.5;color:#0f172a">
          <h1 style="margin:0 0 16px;font-size:20px">Welcome to Podslice!</h1>
          <p style="margin:0 0 16px">Please verify your email address by clicking the link below:</p>
          <p style="margin:0 0 16px"><a href="${verificationUrl}" style="color:#2563eb;text-decoration:underline">Verify Email</a></p>
          <p style="margin:0 0 0;color:#475569;font-size:12px">This link will expire in 24 hours.</p>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Failed to send verification email via Resend:", error)
    return { success: true }
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || "Podslice <noreply@podslice.ai>"
  
  // Redirect test emails to a real address to prevent bounces
  const testEmailRedirect = process.env.TEST_EMAIL
  const actualRecipient = testEmailRedirect && email.endsWith("@demo.com") 
    ? testEmailRedirect 
    : email

  try {
    if (!apiKey) {
      console.warn("[v0] RESEND_API_KEY not set; logging password reset link instead.")
      console.log(`[v0] Password reset email for ${email} (would send to: ${actualRecipient}):`)
      console.log(`[v0] Reset URL: ${resetUrl}`)
      return { success: true }
    }

    const { Resend } = await import("resend")
    const resend = new Resend(apiKey)

    await resend.emails.send({
      from,
      to: actualRecipient,
      subject: "Reset your password",
      html: `
        <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.5;color:#0f172a">
          <h1 style="margin:0 0 16px;font-size:20px">Reset Your Password</h1>
          <p style="margin:0 0 16px">Click the link below to reset your password:</p>
          <p style="margin:0 0 16px"><a href="${resetUrl}" style="color:#2563eb;text-decoration:underline">Reset Password</a></p>
          <p style="margin:0 0 0;color:#475569;font-size:12px">This link will expire in 1 hour.</p>
          <p style="margin:8px 0 0;color:#475569;font-size:12px">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Failed to send password reset email via Resend:", error)
    return { success: true }
  }
}
