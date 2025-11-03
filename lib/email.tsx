"use server"

// Email utility for sending verification and reset emails
// In production, integrate with services like Resend, SendGrid, or AWS SES

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}`

  // TODO: Replace with actual email service integration
  console.log(`[v0] Verification email for ${email}:`)
  console.log(`[v0] Verification URL: ${verificationUrl}`)

  // Example with Resend (uncomment when ready):
  // const { Resend } = await import('resend')
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'Podslice <noreply@podslice.com>',
  //   to: email,
  //   subject: 'Verify your email address',
  //   html: `
  //     <h1>Welcome to Podslice!</h1>
  //     <p>Please verify your email address by clicking the link below:</p>
  //     <a href="${verificationUrl}">Verify Email</a>
  //     <p>This link will expire in 24 hours.</p>
  //   `
  // })

  return { success: true }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`

  // TODO: Replace with actual email service integration
  console.log(`[v0] Password reset email for ${email}:`)
  console.log(`[v0] Reset URL: ${resetUrl}`)

  // Example with Resend (uncomment when ready):
  // const { Resend } = await import('resend')
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'Podslice <noreply@podslice.com>',
  //   to: email,
  //   subject: 'Reset your password',
  //   html: `
  //     <h1>Reset Your Password</h1>
  //     <p>Click the link below to reset your password:</p>
  //     <a href="${resetUrl}">Reset Password</a>
  //     <p>This link will expire in 1 hour.</p>
  //     <p>If you didn't request this, please ignore this email.</p>
  //   `
  // })

  return { success: true }
}
