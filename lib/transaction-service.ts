"use server"

import { createServerSupabaseClient } from "./supabase"

export async function createTransaction(userId: string, particulars: string, amount: number, type: "credit" | "debit") {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      particulars,
      amount,
      type,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, transaction: data }
}

export async function getUserTransactions(userId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, transactions: data }
}

export async function calculateBalance(userId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("transactions").select("amount, type").eq("user_id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  let balance = 0
  data.forEach((transaction) => {
    if (transaction.type === "credit") {
      balance += Number.parseFloat(transaction.amount)
    } else {
      balance -= Number.parseFloat(transaction.amount)
    }
  })

  return { success: true, balance }
}
