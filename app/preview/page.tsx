"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Download, Printer } from "lucide-react"
import Link from "next/link"

interface ReceiptItem {
  description: string
  quantity: number
  price: number
}

interface ReceiptData {
  receiptNumber: string
  date: string
  customerName: string
  customerContact: string
  paymentType: string
  notes: string
  items: ReceiptItem[]
  total: number
  createdAt: string
  paymentDetails?: {
    cardNumber?: string
    phoneNumber?: string
  }
  storeInfo?: {
    name: string
    address: string
    contact: string
    countryCode?: string
  }
}

export default function ReceiptPreview() {
  const router = useRouter()
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get receipt data from localStorage
    const storedData = localStorage.getItem("receiptData")
    if (storedData) {
      setReceiptData(JSON.parse(storedData))
    } else {
      // If no data, redirect back to create page
      router.push("/create")
    }
    setLoading(false)
  }, [router])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create a printable version
    const receiptHtml = document.getElementById("receipt-content")?.innerHTML
    if (!receiptHtml) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
  <html>
    <head>
      <title>Receipt ${receiptData?.receiptNumber}</title>
      <style>
        @page { size: A4; margin: 1cm; }
        body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { font-weight: bold; }
        .receipt-header { text-align: center; margin-bottom: 20px; }
        .receipt-info { margin-bottom: 20px; }
        .receipt-total { font-weight: bold; text-align: right; margin-top: 20px; }
        .receipt-notes { margin-top: 30px; font-style: italic; }
        @media print {
          body { width: 100%; }
          table { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      ${receiptHtml}
    </body>
  </html>
`)

    printWindow.document.close()
    printWindow.focus()

    // Print and download as PDF
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const formatCardNumberWithSpaces = (cardNumber: string) => {
    // Add spaces every 4 characters
    let formatted = ""
    for (let i = 0; i < cardNumber.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += " "
      }
      formatted += cardNumber[i]
    }
    return formatted
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!receiptData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>No receipt data found. Please create a new receipt.</p>
        <Link href="/create">
          <Button className="mt-4">Create Receipt</Button>
        </Link>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <Link href="/create">
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Form
          </Button>
        </Link>
        <div className="space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </div>
      </div>

      <Card className="p-8 shadow-lg print:shadow-none print:p-4 print:border-none" id="receipt-content">
        <div className="receipt-header text-center mb-8">
          {receiptData.storeInfo?.name && (
            <h1 className="text-2xl font-bold mb-1 print:text-xl">{receiptData.storeInfo.name}</h1>
          )}
          {receiptData.storeInfo?.address && (
            <p className="text-gray-600 text-sm mb-1">{receiptData.storeInfo.address}</p>
          )}
          {receiptData.storeInfo?.contact && (
            <p className="text-gray-600 text-sm mb-3">
              Contact: {receiptData.storeInfo.countryCode || "+91"} {receiptData.storeInfo.contact}
            </p>
          )}
          <h2 className="text-xl font-bold mt-4 print:text-lg">RECEIPT</h2>
          <p className="text-gray-500">#{receiptData.receiptNumber}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 print:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold mb-2">Receipt Details</h2>
            <div className="space-y-1">
              <p>
                <span className="font-medium">Date: </span>
                {formatDate(receiptData.date)}
              </p>
              <p>
                <span className="font-medium">Payment Method: </span>
                {receiptData.paymentType.charAt(0).toUpperCase() + receiptData.paymentType.slice(1)}
              </p>
              {receiptData.paymentDetails?.cardNumber && (
                <p>
                  <span className="font-medium">Card Number: </span>
                  XXXXXXXXXXXX {formatCardNumberWithSpaces(receiptData.paymentDetails.cardNumber.slice(-4))}
                </p>
              )}
              {receiptData.paymentDetails?.phoneNumber && (
                <p>
                  <span className="font-medium">Phone Number: </span>
                  XXXXXXX{receiptData.paymentDetails.phoneNumber.slice(-3)}
                </p>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Customer Details</h2>
            <div className="space-y-1">
              <p>
                <span className="font-medium">Name: </span>
                {receiptData.customerName}
              </p>
              {receiptData.customerContact && (
                <p>
                  <span className="font-medium">Contact: </span>
                  {receiptData.customerContact}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 overflow-x-auto print:overflow-visible">
          <h2 className="text-lg font-semibold mb-4 print:text-base">Items</h2>
          <table className="w-full print:text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Rate</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {receiptData.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 max-w-[150px] md:max-w-none">{item.description}</td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">₹{item.price.toFixed(2)}</td>
                  <td className="text-right py-2">₹{(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-right">
            <div className="text-lg font-bold print:text-base">Total: ₹{receiptData.total.toFixed(2)}</div>
          </div>
        </div>

        {receiptData.notes && (
          <div className="mt-8 border-t pt-4">
            <h2 className="text-lg font-semibold mb-2">Notes</h2>
            <p className="text-gray-700">{receiptData.notes}</p>
          </div>
        )}

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
          <p className="mt-1">Generated on {new Date(receiptData.createdAt).toLocaleString()}</p>
        </div>
      </Card>
    </div>
  )
}
