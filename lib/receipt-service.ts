"use server"

import { createServerSupabaseClient } from "./supabase"

export async function createReceipt(receiptData: any) {
  const supabase = createServerSupabaseClient()

  // First, insert the receipt
  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .insert({
      user_id: receiptData.userId,
      receipt_number: receiptData.receiptNumber,
      date: receiptData.date,
      customer_name: receiptData.customerName,
      customer_contact: receiptData.customerContact,
      customer_country_code: receiptData.customerCountryCode,
      payment_type: receiptData.paymentType,
      payment_details: receiptData.paymentDetails,
      notes: receiptData.notes,
      total: receiptData.total,
    })
    .select()
    .single()

  if (receiptError) {
    return { success: false, error: receiptError.message }
  }

  // Then, insert the receipt items
  const receiptItems = receiptData.items.map((item: any) => ({
    receipt_id: receipt.id,
    description: item.description,
    quantity: item.quantity,
    price: item.price,
  }))

  const { error: itemsError } = await supabase.from("receipt_items").insert(receiptItems)

  if (itemsError) {
    // If there was an error inserting the items, delete the receipt
    await supabase.from("receipts").delete().eq("id", receipt.id)
    return { success: false, error: itemsError.message }
  }

  return { success: true, receipt }
}

export async function getReceiptById(receiptId: string) {
  const supabase = createServerSupabaseClient()

  // Get the receipt
  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", receiptId)
    .single()

  if (receiptError) {
    return { success: false, error: receiptError.message }
  }

  // Get the receipt items
  const { data: items, error: itemsError } = await supabase
    .from("receipt_items")
    .select("*")
    .eq("receipt_id", receiptId)

  if (itemsError) {
    return { success: false, error: itemsError.message }
  }

  return { success: true, receipt: { ...receipt, items } }
}

export async function getUserReceipts(userId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, receipts: data }
}
