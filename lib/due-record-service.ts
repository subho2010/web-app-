"use server"

import { createServerSupabaseClient } from "./supabase"

export async function createDueRecord(userId: string, dueData: any) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("due_records")
    .insert({
      user_id: userId,
      customer_name: dueData.customerName,
      customer_contact: dueData.customerContact,
      customer_country_code: dueData.customerCountryCode,
      product_ordered: dueData.productOrdered,
      quantity: dueData.quantity,
      amount_due: dueData.amountDue,
      expected_payment_date: dueData.expectedPaymentDate,
      is_paid: false,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, dueRecord: data }
}

export async function getUserDueRecords(userId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("due_records")
    .select("*")
    .eq("user_id", userId)
    .order("expected_payment_date", { ascending: true })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, dueRecords: data }
}

export async function markDueRecordAsPaid(recordId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("due_records")
    .update({
      is_paid: true,
      paid_at: new Date().toISOString(),
    })
    .eq("id", recordId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, dueRecord: data }
}

export async function calculateTotalDueBalance(userId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("due_records").select("amount_due, is_paid").eq("user_id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  let totalDue = 0
  data.forEach((record) => {
    if (!record.is_paid) {
      totalDue += Number.parseFloat(record.amount_due)
    }
  })

  return { success: true, totalDue }
}
