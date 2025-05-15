"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { PhoneInput } from "@/components/phone-input"

interface DueRecord {
  id: string
  customerName: string
  customerContact: string
  customerCountryCode: string
  productOrdered: string
  quantity: number
  amountDue: number
  expectedPaymentDate: string
  createdAt: string
  isPaid: boolean
  paidAt?: string
}

const countryCodes = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+66", flag: "🇹🇭", name: "Thailand" },
]

export default function DuePage() {
  const router = useRouter()
  const [dueRecords, setDueRecords] = useState<DueRecord[]>([])
  const [formData, setFormData] = useState({
    customerName: "",
    customerContact: "",
    customerCountryCode: "+91", // Default to India
    productOrdered: "",
    quantity: "1",
    amountDue: "",
    expectedPaymentDate: new Date().toISOString().split("T")[0],
  })
  const [contactError, setContactError] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check if user is logged in
    const userJSON = localStorage.getItem("currentUser")
    if (!userJSON) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(userJSON)

    // Check if profile is complete
    if (!userData.profileComplete) {
      router.push("/profile?from=/accounts")
      return
    }

    // Only update user state if it has changed
    if (!user || user.id !== userData.id) {
      setUser(userData)
    }

    // Load due records from localStorage
    const storedRecords = localStorage.getItem("dueRecords")
    if (storedRecords) {
      const parsedRecords = JSON.parse(storedRecords)
      // Only update if records have changed
      if (JSON.stringify(dueRecords) !== JSON.stringify(parsedRecords)) {
        setDueRecords(parsedRecords)
      }
    }
  }, [router, user, dueRecords])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "customerContact") {
      const contactValue = value.replace(/\D/g, "").slice(0, 10)
      setFormData({
        ...formData,
        [name]: contactValue,
      })

      if (contactValue.length !== 10) {
        setContactError("Contact number must be exactly 10 digits")
      } else {
        setContactError("")
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handlePhoneChange = (value: string, countryCode: string) => {
    setFormData({
      ...formData,
      customerContact: value,
      customerCountryCode: countryCode,
    })

    if (value.length !== 10) {
      setContactError("Contact number must be exactly 10 digits")
    } else {
      setContactError("")
    }
  }

  const saveData = (newRecords: DueRecord[]) => {
    localStorage.setItem("dueRecords", JSON.stringify(newRecords))
    setDueRecords(newRecords)
  }

  const handleSave = () => {
    // Validate form
    if (
      !formData.customerName ||
      !formData.customerContact ||
      !formData.productOrdered ||
      !formData.quantity ||
      !formData.amountDue ||
      !formData.expectedPaymentDate ||
      isNaN(Number.parseFloat(formData.amountDue)) ||
      Number.parseFloat(formData.amountDue) <= 0 ||
      isNaN(Number.parseInt(formData.quantity)) ||
      Number.parseInt(formData.quantity) <= 0
    ) {
      alert("Please fill all fields with valid information")
      return
    }

    // Validate contact number
    if (formData.customerContact.length !== 10) {
      alert("Please enter a valid 10-digit contact number")
      return
    }

    const newRecord: DueRecord = {
      id: Date.now().toString(),
      customerName: formData.customerName,
      customerContact: formData.customerContact,
      customerCountryCode: formData.customerCountryCode,
      productOrdered: formData.productOrdered,
      quantity: Number.parseInt(formData.quantity),
      amountDue: Number.parseFloat(formData.amountDue),
      expectedPaymentDate: formData.expectedPaymentDate,
      createdAt: new Date().toISOString(),
      isPaid: false,
    }

    const newRecords = [...dueRecords, newRecord]
    saveData(newRecords)

    // Update total due balance in localStorage
    updateTotalDueBalance(newRecords)

    // Reset form
    setFormData({
      customerName: "",
      customerContact: "",
      customerCountryCode: "+91",
      productOrdered: "",
      quantity: "1",
      amountDue: "",
      expectedPaymentDate: new Date().toISOString().split("T")[0],
    })
    setContactError("")
  }

  const updateTotalDueBalance = (records: DueRecord[]) => {
    const totalDue = records.reduce((total, record) => {
      if (!record.isPaid) {
        return total + record.amountDue
      }
      return total
    }, 0)

    localStorage.setItem("totalDueBalance", totalDue.toString())
  }

  const handleMarkAsPaid = (id: string) => {
    const record = dueRecords.find((r) => r.id === id)
    if (!record || record.isPaid) return

    // Update the record to mark as paid
    const updatedRecords = dueRecords.map((r) => {
      if (r.id === id) {
        return { ...r, isPaid: true, paidAt: new Date().toISOString() }
      }
      return r
    })

    // Save updated records
    saveData(updatedRecords)

    // Update total due balance
    updateTotalDueBalance(updatedRecords)

    // Add the payment to transactions in accounts
    const storedTransactions = localStorage.getItem("accountTransactions")
    const storedBalance = localStorage.getItem("accountBalance")

    let transactions = storedTransactions ? JSON.parse(storedTransactions) : []
    let balance = storedBalance ? Number.parseFloat(storedBalance) : 0

    // Add new transaction for the payment received
    const newTransaction = {
      id: Date.now().toString(),
      particulars: `Payment received from ${record.customerName} for ${record.productOrdered}`,
      amount: record.amountDue,
      type: "credit",
      date: new Date().toISOString(),
    }

    transactions = [...transactions, newTransaction]
    balance += record.amountDue

    // Save updated transactions and balance
    localStorage.setItem("accountTransactions", JSON.stringify(transactions))
    localStorage.setItem("accountBalance", balance.toString())
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const isPastDue = (dateString: string) => {
    const dueDate = new Date(dateString)
    const today = new Date()
    return dueDate < today
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <Link href="/accounts">
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Accounts
          </Button>
        </Link>
      </div>

      <Card className="max-w-4xl mx-auto mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Add Due Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
                className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerContact">Customer Contact</Label>
              <PhoneInput
                value={formData.customerContact}
                countryCode={formData.customerCountryCode}
                onChange={handlePhoneChange}
                placeholder="Enter phone number"
              />
              {contactError && <p className="text-sm text-red-500">{contactError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="productOrdered">Product Ordered</Label>
              <Input
                id="productOrdered"
                name="productOrdered"
                value={formData.productOrdered}
                onChange={handleChange}
                placeholder="Enter product details"
                required
                className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountDue">Amount Due</Label>
              <Input
                id="amountDue"
                name="amountDue"
                type="number"
                min="0.01"
                step="0.1"
                value={formData.amountDue}
                onChange={handleChange}
                placeholder="Enter amount due"
                required
                className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedPaymentDate">Expected Payment Date</Label>
              <Input
                id="expectedPaymentDate"
                name="expectedPaymentDate"
                type="date"
                value={formData.expectedPaymentDate}
                onChange={handleChange}
                required
                className="backdrop-blur-sm bg-white/30 border border-gray-200 shadow-sm"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button onClick={handleSave} className="w-full bg-red-600 hover:bg-red-700">
              Save Due Record
            </Button>
          </div>
        </CardContent>
      </Card>

      {dueRecords.length > 0 && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Due Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="border rounded-lg overflow-hidden hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Customer
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Qty
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Due Date
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dueRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.customerName}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <span className="mr-1">
                              {countryCodes.find((c) => c.code === record.customerCountryCode)?.flag || "🌍"}
                            </span>
                            <span className="truncate max-w-[80px] md:max-w-none">
                              {record.customerCountryCode} {record.customerContact}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 max-w-[80px] truncate md:max-w-none md:whitespace-nowrap">
                          {record.productOrdered}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{record.quantity}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                          ₹{record.amountDue.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={
                              isPastDue(record.expectedPaymentDate) && !record.isPaid ? "text-red-600 font-medium" : ""
                            }
                          >
                            {formatDate(record.expectedPaymentDate)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.isPaid
                                ? "bg-green-100 text-green-800"
                                : isPastDue(record.expectedPaymentDate)
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {record.isPaid ? "Paid" : isPastDue(record.expectedPaymentDate) ? "Overdue" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {!record.isPaid ? (
                            <Button
                              onClick={() => handleMarkAsPaid(record.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="mr-1 h-3 w-3" /> Mark Paid
                            </Button>
                          ) : (
                            <span className="text-gray-500 text-xs">Paid on {formatDate(record.paidAt || "")}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile card view for due records */}
              <div className="md:hidden mt-4 space-y-4">
                {dueRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`p-4 rounded-lg border ${
                      record.isPaid
                        ? "bg-green-50 border-green-200"
                        : isPastDue(record.expectedPaymentDate)
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{record.customerName}</h3>
                        <p className="text-sm text-gray-600 truncate">{record.productOrdered}</p>
                      </div>
                      <span className="font-bold text-red-600">₹{record.amountDue.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                      <div className="flex items-center">
                        <span className="mr-1">
                          {countryCodes.find((c) => c.code === record.customerCountryCode)?.flag || "🌍"}
                        </span>
                        <span>
                          {record.customerCountryCode} {record.customerContact}
                        </span>
                      </div>
                      <span>Qty: {record.quantity}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs text-gray-500 mr-2">Due: </span>
                        <span
                          className={`text-xs ${isPastDue(record.expectedPaymentDate) && !record.isPaid ? "text-red-600 font-medium" : ""}`}
                        >
                          {formatDate(record.expectedPaymentDate)}
                        </span>
                      </div>

                      {!record.isPaid ? (
                        <Button
                          onClick={() => handleMarkAsPaid(record.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="mr-1 h-3 w-3" /> Mark Paid
                        </Button>
                      ) : (
                        <span className="text-xs text-green-600">Paid on {formatDate(record.paidAt || "")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
