"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Download,
  Share2,
  X,
  Copy,
  Check,
  Mail,
  Printer,
  FileText,
  MessageSquare,
  Star,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Shield,
} from "lucide-react"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface TransactionReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string | null
  onDisputeOpen?: (transactionId: string) => void
}

export function TransactionReceiptModal({ open, onOpenChange, transactionId, onDisputeOpen }: TransactionReceiptModalProps) {
  const { transactions, userProfile } = useBanking()
  const { toast } = useToast()
  const [isFavorite, setIsFavorite] = useState(false)
  const [copiedRef, setCopiedRef] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [receiptLoaded, setReceiptLoaded] = useState(false)

  const transaction = transactionId ? transactions.find((t) => t.id === transactionId) : null

  // Simulate receipt loading for smooth UX (like Chase app)
  useEffect(() => {
    if (open && transaction) {
      setIsLoading(true)
      setReceiptLoaded(false)
      const timer = setTimeout(() => {
        setIsLoading(false)
        setReceiptLoaded(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open, transaction])

  // Reset states when closing
  useEffect(() => {
    if (!open) {
      setReceiptLoaded(false)
      setCopiedRef(false)
    }
  }, [open])

  if (!transaction) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-center text-muted-foreground py-8">Transaction receipt not available.</p>
        </DialogContent>
      </Dialog>
    )
  }

  const generateReceiptText = () => {
    const timestamp = new Date().toISOString()
    const receiptNumber = `CHK${Date.now().toString().slice(-10)}`
    const totalAmount = (transaction.amount ?? 0) + (transaction.fee ?? 0)
    
    return `
╔════════════════════════════════════════════════════════════╗
║                   JPMORGAN CHASE BANK                      ║
║                 TRANSACTION RECEIPT                         ║
╚════════════════════════════════════════════════════════════╝

ACCOUNT INFORMATION
════════════════════════════════════════════════════════════
Account Holder:        ${userProfile?.name || "Lin Huang"}
Account Email:         ${userProfile?.email || "linhuang011@gmail.com"}
Account Type:          ${transaction.accountFrom || "Checking"}

TRANSACTION DETAILS
════════════════════════════════════════════════════════════
Receipt Number:        ${receiptNumber}
Reference ID:          ${transaction.reference}
Transaction Type:      ${transaction.description}
Status:                ${transaction.status.toUpperCase()}
Timestamp:             ${new Date(transaction.date).toLocaleString('en-US')}

AMOUNT DETAILS
════════════════════════════════════════════════════════════
Transaction Amount:    ${transaction.type === "debit" ? "-" : "+"}$${(transaction.amount ?? 0).toFixed(2)}
${transaction.fee ? `Processing Fee:        $${(transaction.fee ?? 0).toFixed(2)}` : ""}
${transaction.fee ? `─────────────────────────────────────────────────────` : ""}
${transaction.fee ? `Total Amount:          $${totalAmount.toFixed(2)}` : ""}

TRANSACTION INFORMATION
════════════════════════════════════════════════════════════
Category:              ${transaction.category}
${transaction.recipientName ? `Recipient:             ${transaction.recipientName}` : ""}
${transaction.senderName ? `Sender:                ${transaction.senderName}` : ""}
${transaction.accountFrom ? `From Account:          ${transaction.accountFrom}` : ""}
${transaction.accountTo ? `To Account:            ${transaction.accountTo}` : ""}
${transaction.bankName ? `Bank:                  ${transaction.bankName}` : ""}
${transaction.routingNumber ? `Routing Number:        ${transaction.routingNumber}` : ""}

SECURITY & VERIFICATION
════════════════════════════════════════════════════════════
Method:                Digital Banking
Device:                Mobile Device
Location Verified:     Yes
Encryption:            AES-256 SSL
Transaction Secure:    Yes

IMPORTANT INFORMATION
════════════════════════════════════════════════════════════
• Receipt generated digitally at ${new Date().toLocaleTimeString('en-US')}
• Keep this receipt for your records
• For disputes, contact Chase immediately
• Reference this receipt ID for customer service inquiries
• This transaction has been verified and secured

═══════════════════════════════════════════════════════════════
                     CHASE CUSTOMER SERVICE
                        1-800-935-9935
            www.chase.com | chase.com/support
                © ${new Date().getFullYear()} JPMorgan Chase & Co.
═══════════════════════════════════════════════════════════════
    `
  }

  const generateReceiptHTML = () => {
    const timestamp = new Date().toISOString()
    const receiptNumber = `CHK${Date.now().toString().slice(-10)}`
    const totalAmount = (transaction.amount ?? 0) + (transaction.fee ?? 0)
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chase Bank Receipt - ${transaction.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      background: #f5f7fa; 
      padding: 20px;
      color: #333;
    }
    .receipt-container {
      max-width: 650px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0a4fa6 0%, #083d80 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 4px solid #ffc000;
    }
    .header-logo { font-size: 32px; font-weight: bold; letter-spacing: 2px; margin-bottom: 8px; }
    .header-subtitle { font-size: 14px; opacity: 0.95; letter-spacing: 1px; }
    .receipt-number { 
      background: rgba(255,255,255,0.1);
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 11px;
      margin-top: 12px;
      font-family: monospace;
    }
    
    .content { padding: 30px 20px; }
    
    .status-section {
      text-align: center;
      margin-bottom: 25px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 25px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-badge.completed { background: #dcfce7; color: #166534; }
    .status-badge.pending { background: #fef9c3; color: #854d0e; }
    .status-badge.failed { background: #fee2e2; color: #991b1b; }
    
    .amount-section {
      text-align: center;
      padding: 25px;
      margin-bottom: 25px;
      border: 2px solid #0a4fa6;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(10,79,166,0.05) 0%, rgba(1,61,128,0.05) 100%);
    }
    .amount-label { 
      font-size: 11px; 
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .amount-value {
      font-size: 42px;
      font-weight: bold;
      letter-spacing: -1px;
    }
    .amount-value.debit { color: #dc2626; }
    .amount-value.credit { color: #16a34a; }
    .amount-fee { 
      font-size: 13px; 
      margin-top: 10px;
      color: #0a4fa6;
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
    }
    
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
      color: #0a4fa6;
      margin-bottom: 12px;
      border-bottom: 2px solid #0a4fa6;
      padding-bottom: 8px;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label {
      color: #666;
      font-weight: 500;
      flex: 0 0 40%;
    }
    .detail-value {
      color: #333;
      font-weight: 600;
      text-align: right;
      flex: 1;
      word-break: break-word;
    }
    
    .security-section {
      background: linear-gradient(135deg, rgba(10,79,166,0.08) 0%, rgba(1,61,128,0.05) 100%);
      border: 1px solid rgba(10,79,166,0.2);
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .security-item {
      display: flex;
      align-items: center;
      font-size: 12px;
      margin: 6px 0;
    }
    .security-icon { color: #16a34a; font-weight: bold; margin-right: 8px; }
    
    .footer {
      background: #f8f9fa;
      border-top: 1px solid #e5e7eb;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .footer-title { 
      font-weight: bold;
      margin-bottom: 8px;
      color: #0a4fa6;
      font-size: 13px;
    }
    .footer-contact { margin: 5px 0; }
    .footer-copyright {
      margin-top: 12px;
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
      font-size: 11px;
      color: #999;
    }
    .print-date {
      text-align: right;
      font-size: 10px;
      color: #999;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
    }
    
    @media print {
      body { background: white; }
      .receipt-container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div class="header">
      <div class="header-logo">CHASE</div>
      <div class="header-subtitle">Digital Banking Receipt</div>
      <div class="receipt-number">Receipt: ${receiptNumber}</div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- Status -->
      <div class="status-section">
        <span class="status-badge ${transaction.status}">${transaction.status.toUpperCase()}</span>
      </div>
      
      <!-- Amount -->
      <div class="amount-section">
        <div class="amount-label">Transaction Amount</div>
        <div class="amount-value ${transaction.type}">${transaction.type === "debit" ? "-" : "+"}$${(transaction.amount ?? 0).toFixed(2)}</div>
        ${transaction.fee ? `<div class="amount-fee">Processing Fee: +$${(transaction.fee ?? 0).toFixed(2)}<br/><strong>Total: $${totalAmount.toFixed(2)}</strong></div>` : ""}
      
      <!-- Account Information -->
      <div class="section">
        <div class="section-title">Account Information</div>
        <div class="detail-row">
          <span class="detail-label">Account Holder</span>
          <span class="detail-value">${userProfile?.name || "Lin Huang"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">${userProfile?.email || "linhuang011@gmail.com"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Account Type</span>
          <span class="detail-value">${transaction.accountFrom || "Checking"}</span>
        </div>
      </div>
      
      <!-- Transaction Details -->
      <div class="section">
        <div class="section-title">Transaction Details</div>
        <div class="detail-row">
          <span class="detail-label">Reference ID</span>
          <span class="detail-value" style="font-family: monospace;">${transaction.reference}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Type</span>
          <span class="detail-value">${transaction.description}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Category</span>
          <span class="detail-value">${transaction.category}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time</span>
          <span class="detail-value">${formatDate(transaction.date)}</span>
        </div>
      </div>
      
      <!-- Transaction Parties -->
      ${
        transaction.recipientName || transaction.senderName || transaction.accountFrom || transaction.accountTo
          ? `
      <div class="section">
        <div class="section-title">Transaction Parties</div>
        ${transaction.accountFrom ? `<div class="detail-row"><span class="detail-label">From Account</span><span class="detail-value">${transaction.accountFrom}</span></div>` : ""}
        ${transaction.accountTo ? `<div class="detail-row"><span class="detail-label">To Account</span><span class="detail-value">${transaction.accountTo}</span></div>` : ""}
        ${transaction.recipientName ? `<div class="detail-row"><span class="detail-label">Recipient</span><span class="detail-value">${transaction.recipientName}</span></div>` : ""}
        ${transaction.senderName ? `<div class="detail-row"><span class="detail-label">Sender</span><span class="detail-value">${transaction.senderName}</span></div>` : ""}
        ${transaction.bankName ? `<div class="detail-row"><span class="detail-label">Bank Name</span><span class="detail-value">${transaction.bankName}</span></div>` : ""}
        ${transaction.routingNumber ? `<div class="detail-row"><span class="detail-label">Routing Number</span><span class="detail-value" style="font-family: monospace;">${transaction.routingNumber}</span></div>` : ""}
      </div>`
          : ""
      }
      
      <!-- Security Information -->
      <div class="security-section">
        <div class="section-title" style="margin-bottom: 8px;">Security & Verification</div>
        <div class="security-item">
          <span class="security-icon">✓</span>
          <span>SSL/TLS 256-bit Encryption</span>
        </div>
        <div class="security-item">
          <span class="security-icon">✓</span>
          <span>Digital Signature Verified</span>
        </div>
        <div class="security-item">
          <span class="security-icon">✓</span>
          <span>Transaction Secured & Authenticated</span>
        </div>
      </div>
      
      <!-- Receipt Notice -->
      <div style="background: #faf8f3; border-left: 4px solid #ffc000; padding: 12px; border-radius: 4px; font-size: 11px; color: #666; margin-bottom: 20px;">
        <strong style="color: #333;">Important Notice:</strong> Keep this receipt for your records. For disputes or inquiries, contact Chase Customer Service with your reference ID.
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-title">Chase Customer Service</div>
      <div class="footer-contact">Phone: 1-800-935-9935</div>
      <div class="footer-contact">Website: www.chase.com</div>
      <div class="footer-contact">Support: chase.com/support</div>
      <div class="footer-copyright">
        © ${new Date().getFullYear()} JPMorgan Chase & Co. All rights reserved.<br/>
        Generated: ${new Date().toLocaleString('en-US')}
      </div>
    </div>
  </div>
</body>
</html>
    `
  }

  const handleDownloadPDF = () => {
    const receiptContent = generateReceiptText()
    const blob = new Blob([receiptContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chase-receipt-${transaction.reference}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: "Receipt Downloaded", description: "Your receipt has been downloaded." })
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML())
      printWindow.document.close()
      printWindow.print()
    }
    toast({ title: "Printing Receipt", description: "Print dialog opened." })
  }

  const handleShare = async () => {
    const shareText = `Chase Receipt: ${transaction.description} - $${(transaction.amount ?? 0).toFixed(2)} - Ref: ${transaction.reference}`
    if (navigator.share) {
      try {
        await navigator.share({ title: "Chase Transaction Receipt", text: shareText })
      } catch {
        navigator.clipboard.writeText(shareText)
        toast({ title: "Copied to Clipboard", description: "Receipt details copied." })
      }
    } else {
      navigator.clipboard.writeText(shareText)
      toast({ title: "Copied to Clipboard", description: "Receipt details copied." })
    }
  }

  const handleCopyReference = () => {
    navigator.clipboard.writeText(transaction.reference)
    setCopiedRef(true)
    toast({ title: "Reference Copied", description: `${transaction.reference} copied to clipboard.` })
    setTimeout(() => setCopiedRef(false), 2000)
  }

  const handleEmailReceipt = () => {
    const subject = encodeURIComponent(`Chase Receipt - ${transaction.reference}`)
    const body = encodeURIComponent(generateReceiptText())
    window.open(`mailto:?subject=${subject}&body=${body}`)
    toast({ title: "Email Client Opened", description: "Receipt ready to send via email." })
  }

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "completed":
        return <Check className="h-5 w-5 text-green-600" />
      case "pending":
        return <span className="text-yellow-600">⏱</span>
      case "failed":
        return <X className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    const favoriteReceipts = JSON.parse(localStorage.getItem("chase_favorite_receipts") || "[]")
    if (!isFavorite) {
      favoriteReceipts.push(transactionId)
      localStorage.setItem("chase_favorite_receipts", JSON.stringify(favoriteReceipts))
      toast({ title: "Added to Favorites", description: "Receipt saved to favorites." })
    } else {
      const updated = favoriteReceipts.filter((id: string) => id !== transactionId)
      localStorage.setItem("chase_favorite_receipts", JSON.stringify(updated))
      toast({ title: "Removed from Favorites", description: "Receipt removed from favorites." })
    }
  }

  const handleSendSMS = () => {
    const message = encodeURIComponent(
      `Chase Receipt: ${transaction.description} - $${(transaction.amount ?? 0).toFixed(2)} - Ref: ${transaction.reference}`,
    )
    window.open(`sms:?body=${message}`)
    toast({ title: "SMS App Opened", description: "Receipt ready to send via text message." })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 p-0 rounded-2xl shadow-2xl">
        {/* Header with Back/Close Button */}
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-[#0a4fa6]/10 px-6 py-4">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#0a4fa6] to-[#083d80] flex items-center justify-center shadow-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-lg font-bold text-[#0a4fa6]">Receipt</DialogTitle>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full h-9 w-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 transition-colors group"
              title="Close receipt"
              aria-label="Close receipt"
            >
              <X className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 pb-6">
          {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-[#0a4fa6] animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading receipt...</p>
          </div>
        ) : (
          <div className="space-y-5 py-2 animate-in fade-in duration-300">
          {/* Status Badge */}
          <div className="text-center space-y-3 mb-2">
            <div
              className={`inline-flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition transform hover:scale-105 ${getStatusColor(transaction.status)}`}
            >
              {getStatusIcon()}
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <p className="text-lg font-bold capitalize text-[#0a4fa6]">{transaction.status}</p>
            </div>
          </div>

          {/* Amount Section */}
          <div className={`text-center rounded-2xl py-6 px-4 shadow-sm border-2 transition ${
            transaction.type === "debit" 
              ? "bg-gradient-to-br from-red-50 to-red-25 border-red-200" 
              : "bg-gradient-to-br from-green-50 to-green-25 border-green-200"
          }`}>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-semibold">Transaction Amount</p>
            <div className={`text-6xl font-bold tracking-tight ${transaction.type === "debit" ? "text-red-600" : "text-green-600"}`}>
              {transaction.type === "debit" ? "-" : "+"}${(transaction.amount ?? 0).toFixed(2)}
            </div>
            {transaction.fee && transaction.fee > 0 ? (
              <p className={`text-sm font-medium mt-3 ${transaction.type === "debit" ? "text-red-700" : "text-green-700"}`}>
                Fee: +${(transaction.fee ?? 0).toFixed(2)}
              </p>
            ) : null}
          </div>

          {/* Details Section */}
          <div className="space-y-0 bg-white rounded-2xl border border-[#0a4fa6]/15 shadow-md overflow-hidden divide-y divide-[#0a4fa6]/10">
            {/* Account Holder */}
            <div className="px-4 py-3 border-b border-[#0a4fa6]/10 hover:bg-[#0a4fa6]/5 transition">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Account Holder</p>
              <p className="font-semibold text-foreground mt-1">{userProfile?.name || "Lin Huang"}</p>
            </div>

            {/* Description */}
            <div className="px-4 py-3 border-b border-[#0a4fa6]/10 hover:bg-[#0a4fa6]/5 transition">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Description</p>
              <p className="font-semibold text-foreground mt-1">{transaction.description}</p>
            </div>

            {/* Date & Category */}
            <div className="grid grid-cols-2 gap-0 border-b border-[#0a4fa6]/10">
              <div className="px-4 py-3 border-r border-[#0a4fa6]/10 hover:bg-[#0a4fa6]/5 transition">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date</p>
                <p className="font-semibold text-foreground mt-1 text-sm">{formatDate(transaction.date)}</p>
              </div>
              <div className="px-4 py-3 hover:bg-[#0a4fa6]/5 transition">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Category</p>
                <p className="font-semibold text-foreground mt-1 text-sm">{transaction.category}</p>
              </div>
            </div>

            {/* Recipient */}
            {transaction.recipientName && (
              <div className="px-4 py-3 border-b border-[#0a4fa6]/10 hover:bg-[#0a4fa6]/5 transition">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recipient</p>
                <p className="font-semibold text-foreground mt-1">{transaction.recipientName}</p>
              </div>
            )}

            {/* Sender */}
            {transaction.senderName && (
              <div className="px-4 py-3 border-b border-[#0a4fa6]/10 hover:bg-[#0a4fa6]/5 transition">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sender</p>
                <p className="font-semibold text-foreground mt-1">{transaction.senderName}</p>
              </div>
            )}

            {/* From Account */}
            {transaction.accountFrom && (
              <div className="px-4 py-3 border-b border-[#0a4fa6]/10 hover:bg-[#0a4fa6]/5 transition">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">From Account</p>
                <p className="font-semibold text-foreground mt-1">{transaction.accountFrom}</p>
              </div>
            )}

            {/* To Account */}
            {transaction.accountTo && (
              <div className="px-4 py-3 border-b border-[#0a4fa6]/10 hover:bg-[#0a4fa6]/5 transition">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">To Account</p>
                <p className="font-semibold text-foreground mt-1">{transaction.accountTo}</p>
              </div>
            )}

            {/* Reference Number */}
            <div className="px-4 py-3 flex items-center justify-between hover:bg-[#0a4fa6]/5 transition">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reference</p>
                <p className="font-mono font-semibold text-foreground mt-1 text-sm break-all">{transaction.reference}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyReference}
                className="ml-2 transition"
                title="Copy reference number"
              >
                {copiedRef ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* Transaction Type Indicator */}
          <div className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#0a4fa6]/5 to-transparent rounded-lg">
            {transaction.type === "debit" ? (
              <>
                <ArrowUpRight className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-600">Money Sent</span>
              </>
            ) : (
              <>
                <ArrowDownLeft className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">Money Received</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-2 bg-gradient-to-r from-[#0a4fa6]/5 to-transparent rounded-2xl p-3 border border-[#0a4fa6]/10">
            {/* Download */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2.5 rounded-md hover:bg-white transition"
              onClick={handleDownloadPDF}
              title="Download receipt"
            >
              <Download className="h-5 w-5 text-[#0a4fa6] mb-1" />
              <span className="text-xs font-medium">Download</span>
            </Button>

            {/* Print */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2.5 rounded-md hover:bg-white transition"
              onClick={handlePrint}
              title="Print receipt"
            >
              <Printer className="h-5 w-5 text-[#0a4fa6] mb-1" />
              <span className="text-xs font-medium">Print</span>
            </Button>

            {/* Share */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-col h-auto py-2.5 rounded-md hover:bg-white transition"
                  title="Share receipt"
                >
                  <Share2 className="h-5 w-5 text-[#0a4fa6] mb-1" />
                  <span className="text-xs font-medium">Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Copy className="h-4 w-4 mr-2 text-[#0a4fa6]" />
                  <span>Copy to clipboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEmailReceipt}>
                  <Mail className="h-4 w-4 mr-2 text-[#0a4fa6]" />
                  <span>Email receipt</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendSMS}>
                  <MessageSquare className="h-4 w-4 mr-2 text-[#0a4fa6]" />
                  <span>Send via SMS</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Favorite */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2.5 rounded-md hover:bg-white transition"
              onClick={handleToggleFavorite}
              title={isFavorite ? "Remove from favorites" : "Save to favorites"}
            >
              <Star className={`h-5 w-5 mb-1 transition ${isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
              <span className="text-xs font-medium">Save</span>
            </Button>
          </div>

          {/* Dispute Transaction Section */}
          {onDisputeOpen && transactionId && transaction.type === "debit" && (
            <div className="mt-6 pt-4 border-t border-[#0a4fa6]/10">
              <Button
                className="w-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition font-medium flex items-center justify-center gap-2"
                onClick={() => {
                  onOpenChange(false)
                  onDisputeOpen(transactionId)
                }}
              >
                <Shield className="h-4 w-4" />
                Dispute This Transaction
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Report an unauthorized or incorrect transaction
              </p>
            </div>
          )}
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
