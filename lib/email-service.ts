"use server"

import { createServerSupabaseClient } from "./supabase"

// Mock email sending function for preview/development environments
async function mockSendEmail(email: string, code: string) {
  console.log(`[MOCK EMAIL] To: ${email}, Verification Code: ${code}`)
  return { success: true }
}

export async function sendVerificationEmail(email: string, code: string) {
  try {
    // Use mock email sending in preview/development
    const result = await mockSendEmail(email, code)

    // For demo purposes, show the code in an alert (this will be shown in the UI)
    console.log(`Email verification code for ${email}: ${code}`)

    return { success: true, code }
  } catch (error) {
    console.error("Error sending verification email:", error)
    return { success: false, error: "Failed to send verification email" }
  }
}

export async function generateAndStoreEmailOTP(userId: string, email: string) {
  const supabase = createServerSupabaseClient()

  // Generate a 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // Set expiration time (10 minutes from now)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)

  // Store the OTP in the database
  const { error } = await supabase.from("email_verification").insert({
    user_id: userId,
    email,
    code,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    console.error("Error storing email OTP:", error)
    return { success: false, error: "Failed to generate verification code" }
  }

  // Send the OTP via email (mock in preview/development)
  const result = await sendVerificationEmail(email, code)

  // Return the code for demo purposes
  return { ...result, code }
}

export async function verifyEmailOTP(userId: string, email: string, code: string) {
  const supabase = createServerSupabaseClient()

  // Get the latest OTP for this user and email
  const { data, error } = await supabase
    .from("email_verification")
    .select("*")
    .eq("user_id", userId)
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return { success: false, error: "Verification code not found" }
  }

  // Check if the OTP has expired
  const expiresAt = new Date(data.expires_at)
  if (expiresAt < new Date()) {
    return { success: false, error: "Verification code has expired" }
  }

  // Check if the OTP matches
  if (data.code !== code) {
    return { success: false, error: "Invalid verification code" }
  }

  // Update the user's email_verified status
  const { error: updateError } = await supabase.from("users").update({ email_verified: true }).eq("id", userId)

  if (updateError) {
    return { success: false, error: "Failed to verify email" }
  }

  return { success: true }
}
