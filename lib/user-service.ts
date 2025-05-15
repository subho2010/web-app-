"use server"

import { createServerSupabaseClient } from "./supabase"
import { generateAndStoreEmailOTP, verifyEmailOTP } from "./email-service"
import { generateAndStorePhoneOTP, verifyPhoneOTP } from "./sms-service"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcrypt"

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// Helper function to verify passwords
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export async function signUp(email: string, password: string, name: string) {
  console.log("Server: signUp called with", { email, name })
  const supabase = createServerSupabaseClient()

  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing user:", checkError)
      return { success: false, error: "Error checking if user exists" }
    }

    if (existingUser) {
      return { success: false, error: "User with this email already exists" }
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Generate a UUID for the new user
    const userId = uuidv4()

    console.log("Creating user with ID:", userId)

    // Create the user in our custom users table
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      email,
      name,
      password_hash: hashedPassword,
      profile_complete: false,
      email_verified: false,
      phone_verified: false,
    })

    if (userError) {
      console.error("Error creating user:", userError)
      return { success: false, error: userError.message }
    }

    // Also create a profile for the user
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email,
      name,
      profile_complete: false,
      email_verified: false,
      phone_verified: false,
    })

    if (profileError) {
      // If profile creation fails, delete the user to maintain consistency
      await supabase.from("users").delete().eq("id", userId)
      console.error("Error creating profile:", profileError)
      return { success: false, error: profileError.message }
    }

    console.log("User created successfully:", userId)

    return {
      success: true,
      user: {
        id: userId,
        email,
        name,
        profile_complete: false,
        email_verified: false,
        phone_verified: false,
      },
    }
  } catch (error) {
    console.error("Signup error:", error)
    return { success: false, error: "An unexpected error occurred during signup" }
  }
}

export async function signIn(email: string, password: string) {
  console.log("Server: signIn called with", { email })
  const supabase = createServerSupabaseClient()

  try {
    // Get the user from our custom users table
    const { data, error } = await supabase.from("users").select("*").eq("email", email)

    // Check if we got an error from the query itself
    if (error) {
      console.error("Database query error:", error)
      return { success: false, error: "An error occurred while signing in" }
    }

    // Check if we found any users
    if (!data || data.length === 0) {
      console.log("No user found with email:", email)
      return { success: false, error: "Invalid email or password" }
    }

    // Use the first user if multiple were found (shouldn't happen if email is unique)
    const user = data[0]

    // Verify the password
    const passwordValid = await verifyPassword(password, user.password_hash)

    if (!passwordValid) {
      console.log("Invalid password for user:", email)
      return { success: false, error: "Invalid email or password" }
    }

    console.log("User authenticated successfully:", user.id)

    // Return the user data without the password hash
    const { password_hash, ...userWithoutPassword } = user

    return {
      success: true,
      user: userWithoutPassword,
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "An unexpected error occurred during login" }
  }
}

export async function signOut() {
  // Since we're using a custom authentication system, we don't need to do anything here
  // In a real application, you would invalidate the user's session
  return { success: true }
}

export async function getCurrentUser() {
  // In a real application, you would get the current user from the session
  // For now, we'll just return an error
  return { success: false, error: "Not implemented" }
}

export async function updateUserProfile(userId: string, profileData: any) {
  const supabase = createServerSupabaseClient()

  try {
    // Define which fields belong to the users table
    const userFields = ["name", "email", "profile_complete", "email_verified", "phone_verified"]

    // Create separate objects for users and profiles tables
    const usersData: Record<string, any> = {}
    const profilesData = { ...profileData }

    // Only include fields that exist in the users table
    userFields.forEach((field) => {
      if (field in profileData) {
        usersData[field] = profileData[field]
      }
    })

    console.log("Updating users table with:", usersData)
    console.log("Updating profiles table with:", profilesData)

    // Update the user profile in the users table
    const { error: userError } = await supabase.from("users").update(usersData).eq("id", userId)

    if (userError) {
      console.error("Error updating users table:", userError)
      return { success: false, error: userError.message }
    }

    // Update the user profile in the profiles table
    const { error: profileError } = await supabase.from("profiles").update(profilesData).eq("id", userId)

    if (profileError) {
      console.error("Error updating profiles table:", profileError)
      return { success: false, error: profileError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Update profile error:", error)
    return { success: false, error: "An unexpected error occurred while updating profile" }
  }
}

export async function sendEmailVerification(userId: string, email: string) {
  return await generateAndStoreEmailOTP(userId, email)
}

export async function confirmEmailVerification(userId: string, email: string, code: string) {
  return await verifyEmailOTP(userId, email, code)
}

export async function sendPhoneVerification(userId: string, countryCode: string, phone: string) {
  return await generateAndStorePhoneOTP(userId, countryCode, phone)
}

export async function confirmPhoneVerification(userId: string, countryCode: string, phone: string, code: string) {
  return await verifyPhoneOTP(userId, countryCode, phone, code)
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Get the user from our custom users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return { success: false, error: "User not found" }
    }

    // Verify the current password
    const passwordValid = await verifyPassword(currentPassword, user.password_hash)

    if (!passwordValid) {
      return { success: false, error: "Current password is incorrect" }
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword)

    // Update the password
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: hashedPassword })
      .eq("id", userId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Update password error:", error)
    return { success: false, error: "An unexpected error occurred while updating password" }
  }
}
