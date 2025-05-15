"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PhoneInput } from "@/components/phone-input"

export default function CreateReceipt() {
  const router = useRouter()
  const [receiptData, setReceiptData] = useState({
    receiptNumber: "",
    date: "",
    customerName: "",
    customerContact: "",
    customerCountryCode: "+91",
    paymentType: "",
    notes: "",
    items: [{ description: "", quantity: 1, price: 0 }],
  })

  const [user, setUser] = useState<any>(null)
  const [cardNumber, setCardNumber] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneCountryCode, setPhoneCountryCode] = useState("+91")
  const [receiptCount, setReceiptCount] = useState(1)
  const [generatedReceiptNumber, setGeneratedReceiptNumber] = useState("")
  const [customerContactError, setCustomerContactError] = useState("")

  useEffect(() => {
    // Get current date in local timezone format
    const today = new Date()
    const localDate = today.toLocaleDateString("en-CA") // Format as YYYY-MM-DD for input[type="date"]

    // Load user data
    const userJSON = localStorage.getItem("currentUser")
    if (!userJSON) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(userJSON)

    // Check if profile is complete
    if (!userData.profileComplete) {
      router.push("/profile?from=/create")
      return
    }

    // Only update user state if it has changed
    if (!user || user.id !== userData.id) {
      setUser(userData)
    }

    // Generate receipt number only if it hasn't been generated yet
    if (!generatedReceiptNumber && userData.storeName) {
      // Get receipt count for current year
      const receiptsJSON = localStorage.getItem("receipts")
      const receipts = receiptsJSON ? JSON.parse(receiptsJSON) : []
      const currentYear = new Date().getFullYear()

      // Filter receipts for current user and year
      const userReceipts = receipts.filter(
        (receipt: any) => receipt.userId === userData.id && new Date(receipt.createdAt).getFullYear() === currentYear,
      )

      const count = userReceipts.length + 1
      setReceiptCount(count)

      // Generate receipt number format: XYZ-001
      const firstLetterStore = userData.storeName.charAt(0).toUpperCase()
      const firstLetterUser = userData.name.charAt(0).toUpperCase()
      const lastLetterStore = userData.storeName.charAt(userData.storeName.length - 1).toUpperCase()
      const countFormatted = count.toString().padStart(3, "0")

      const receiptNumber = `${firstLetterStore}${firstLetterUser}${lastLetterStore}-${countFormatted}`
      setGeneratedReceiptNumber(receiptNumber)

      // Update receipt data with generated number and current date
      setReceiptData({
        ...receiptData,
        receiptNumber: receiptNumber,
        date: localDate,
      })
    }
  }, [router, user, generatedReceiptNumber, receiptData])

  const addItem = () => {
    setReceiptData({
      ...receiptData,
      items: [...receiptData.items, { description: "", quantity: 1, price: 0 }],
    })
  }

  const removeItem = (index: number) => {
    const newItems = [...receiptData.items]
    newItems.splice(index, 1)
    setReceiptData({ ...receiptData, items: newItems })
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...receiptData.items]

    // Handle numeric values properly to avoid NaN
    if (field === "quantity") {
      // Ensure quantity is a valid number or default to 1
      const numValue = typeof value === "string" ? Number.parseInt(value) : value
      newItems[index] = {
        ...newItems[index],
        [field]: isNaN(numValue) ? 1 : numValue,
      }
    } else if (field === "price") {
      // Ensure price is a valid number or default to 0
      const numValue = typeof value === "string" ? Number.parseFloat(value) : value
      newItems[index] = {
        ...newItems[index],
        [field]: isNaN(numValue) ? 0 : numValue,
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }

    setReceiptData({ ...receiptData, items: newItems })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setReceiptData({ ...receiptData, [name]: value })
  }

  const handlePhoneChange = (value: string, countryCode: string) => {
    setReceiptData({
      ...receiptData,
      customerContact: value,
      customerCountryCode: countryCode,
    })

    if (value.length !== 10) {
      setCustomerContactError("Contact number must be exactly 10 digits")
    } else {
      setCustomerContactError("")
    }
  }

  const handlePaymentPhoneChange = (value: string, countryCode: string) => {
    setPhoneNumber(value)
    setPhoneCountryCode(countryCode)
  }

  const handleSelectChange = (value: string) => {
    setReceiptData({ ...receiptData, paymentType: value })
    // Reset payment-specific fields when changing payment type
    setCardNumber("")
    setPhoneNumber("")
  }

  const calculateTotal = () => {
    return receiptData.items.reduce((total, item) => total + item.quantity * item.price, 0)
  }

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")

    // Format in groups of 4
    let formatted = ""
    for (let i = 0; i < digits.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += " "
      }
      formatted += digits[i]
    }

    return formatted
  }

  const validateCardNumber = (value: string) => {
    return value.replace(/\s/g, "").length === 16
  }

  const validatePhoneNumber = (value: string) => {
    return /^\d{10}$/.test(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate customer contact
    if (receiptData.customerContact.length !== 10) {
      alert("Please enter a valid 10-digit customer contact number")
      return
    }

    // Validate payment details
    if (receiptData.paymentType === "card" && !validateCardNumber(cardNumber)) {
      alert("Please enter a valid 16-digit card number")
      return
    }

    if (receiptData.paymentType === "online" && !validatePhoneNumber(phoneNumber)) {
      alert("Please enter a valid 10-digit phone number")
      return
    }

    // Prepare payment details
    let paymentDetails = {}
    if (receiptData.paymentType === "card") {
      paymentDetails = { cardNumber: cardNumber.replace(/\s/g, "") }
    } else if (receiptData.paymentType === "online") {
      paymentDetails = { phoneNumber, phoneCountryCode }
    }

    // Set default notes if empty
    const notes = receiptData.notes.trim() || "Shop again"

    // Store receipt data
    const receiptDataToSave = {
      ...receiptData,
      notes,
      total: calculateTotal(),
      createdAt: new Date().toISOString(),
      userId: user?.id,
      paymentDetails,
      storeInfo: {
        name: user?.storeName || "",
        address: user?.storeAddress || "",
        contact: user?.storeContact || "",
        countryCode: user?.storeCountryCode || "+91",
      },
    }

    localStorage.setItem("receiptData", JSON.stringify(receiptDataToSave))

    // Save receipt to history
    const receiptsJSON = localStorage.getItem("receipts")
    const receipts = receiptsJSON ? JSON.parse(receiptsJSON) : []
    receipts.push(receiptDataToSave)
    localStorage.setItem("receipts", JSON.stringify(receipts))

    router.push("/preview")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-start mb-6">
        <Link href="/">
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create Receipt</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="receiptNumber">Receipt Number</Label>
                <Input
                  id="receiptNumber"
                  name="receiptNumber"
                  value={receiptData.receiptNumber}
                  readOnly
                  className="bg-gray-50 backdrop-blur-sm bg-opacity-50 border border-gray-200 shadow-sm"
                />
                <p className="text-xs text-gray-500">Auto-generated based on your store name</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={receiptData.date}
                  onChange={handleChange}
                  required
                  className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select value={receiptData.paymentType} onValueChange={handleSelectChange} required>
                  <SelectTrigger
                    id="paymentType"
                    className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
                  >
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {receiptData.paymentType === "card" && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="XXXX XXXX XXXX XXXX"
                  maxLength={19}
                  required
                  className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
                />
                <p className="text-xs text-gray-500">Enter the 16-digit card number</p>
                {cardNumber && !validateCardNumber(cardNumber) && (
                  <p className="text-xs text-red-500">Card number must be exactly 16 digits</p>
                )}
              </div>
            )}

            {receiptData.paymentType === "online" && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <PhoneInput
                  value={phoneNumber}
                  countryCode={phoneCountryCode}
                  onChange={handlePaymentPhoneChange}
                  placeholder="Enter phone number"
                />
                {phoneNumber && !validatePhoneNumber(phoneNumber) && (
                  <p className="text-xs text-red-500">Phone number must be exactly 10 digits</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                name="customerName"
                value={receiptData.customerName}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
                className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerContact">Customer Contact</Label>
              <PhoneInput
                value={receiptData.customerContact}
                countryCode={receiptData.customerCountryCode}
                onChange={handlePhoneChange}
                placeholder="Enter customer phone number"
              />
              {customerContactError && <p className="text-xs text-red-500">{customerContactError}</p>}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>

              {receiptData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-6 space-y-2">
                    <Label htmlFor={`item-${index}-description`}>Description</Label>
                    <Input
                      id={`item-${index}-description`}
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="Item description"
                      required
                      className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor={`item-${index}-quantity`}>Quantity</Label>
                    <Input
                      id={`item-${index}-quantity`}
                      type="number"
                      min="1"
                      value={item.quantity.toString()}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      required
                      className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor={`item-${index}-price`}>Rate</Label>
                    <Input
                      id={`item-${index}-price`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={item.price.toString()}
                      onChange={(e) => updateItem(index, "price", e.target.value)}
                      required
                      className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    {receiptData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-xl font-bold">₹{calculateTotal().toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={receiptData.notes}
                onChange={handleChange}
                placeholder="Additional notes or information (defaults to 'Shop again' if empty)"
                rows={3}
                className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg">
                Generate Receipt
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
