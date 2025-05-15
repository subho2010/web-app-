"use server"

import { createServerSupabaseClient } from "./supabase"

// For production, use a real SMS service like Twilio, Vonage, etc.
// This is a mock implementation
async function sendSMS(phoneNumber: string, message: string) {
  // In a real implementation, you would use an SMS service API
  console.log(`Sending SMS to ${phoneNumber}: ${message}`)

  // For demo purposes, we'll just return success
  // In production, replace this with actual SMS API call
  return { success: true }
}

export async function sendVerificationSMS(countryCode: string, phone: string, code: string) {
  try {
    const fullPhoneNumber = `${countryCode}${phone}`
    const message = `Your Money Records verification code is: ${code}. This code will expire in 10 minutes.`

    // Send SMS with the verification code
    const result = await sendSMS(fullPhoneNumber, message)
    return result
  } catch (error) {
    console.error("Error sending verification SMS:", error)
    return { success: false, error: "Failed to send verification SMS" }
  }
}

// Update the generateAndStorePhoneOTP function to use the correct column names
export async function generateAndStorePhoneOTP(userId: string, countryCode: string, phone: string) {
  const supabase = createServerSupabaseClient()

  // Generate a 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // Set expiration time (10 minutes from now)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 10)

  // Store the OTP in the database
  const { error } = await supabase.from("phone_verification").insert({
    user_id: userId,
    country_code: countryCode,
    phone_number: phone,
    verification_code: code,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    console.error("Error storing phone OTP:", error)
    return { success: false, error: "Failed to generate verification code" }
  }

  // Send the OTP via SMS
  const result = await sendVerificationSMS(countryCode, phone, code)

  // For demo purposes, we'll log the code to the console
  console.log(`Phone verification code for ${countryCode}${phone}: ${code}`)

  return { success: true, code }
}

// Update the verifyPhoneOTP function to use the correct column names
export async function verifyPhoneOTP(userId: string, countryCode: string, phone: string, code: string) {
  const supabase = createServerSupabaseClient()

  // Get the latest OTP for this user and phone
  const { data, error } = await supabase
    .from("phone_verification")
    .select("*")
    .eq("user_id", userId)
    .eq("phone_number", phone)
    .eq("country_code", countryCode)
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
  if (data.verification_code !== code) {
    return { success: false, error: "Invalid verification code" }
  }

  // Update the user's phone_verified status
  const { error: updateError } = await supabase.from("users").update({ phone_verified: true }).eq("id", userId)

  if (updateError) {
    return { success: false, error: "Failed to verify phone" }
  }

  // Update the verification record
  await supabase.from("phone_verification").update({ verified: true }).eq("id", data.id)

  return { success: true }
}
