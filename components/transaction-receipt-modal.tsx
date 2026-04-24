"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Save,
  Bookmark,
  Star,
  AlertTriangle,
} from "lucide-react"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"

interface TransactionReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string | null
  onDisputeOpen?: (transactionId: string) => void
}

export function TransactionReceiptModal({
  open,
  onOpenChange,
  transactionId,
  onDisputeOpen,
}: TransactionReceiptModalProps) {
  const { getTransactionById, userProfile } = useBanking()
  const { toast } = useToast()
  const transaction = transactionId ? getTransactionById(transactionId) : null
  const [copied, setCopied] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailTo, setEmailTo] = useState("")
  const [emailSending, setEmailSending] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  // Check if receipt is already saved
  useEffect(() => {
    if (transaction) {
      const savedReceipts = JSON.parse(localStorage.getItem("chase_saved_receipts") || "[]")
      const favoriteReceipts = JSON.parse(localStorage.getItem("chase_favorite_receipts") || "[]")
      setIsSaved(savedReceipts.some((r: any) => r.id === transaction.id))
      setIsFavorite(favoriteReceipts.some((r: any) => r.id === transaction.id))
    }
  }, [transaction])

  if (!transaction) return null

  const handleCopyReference = () => {
    if (transaction.reference) {
      navigator.clipboard.writeText(transaction.reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: "Copied", description: "Reference ID copied to clipboard" })
    }
  }

  const handleDispute = () => {
    if (transactionId && onDisputeOpen) {
      onOpenChange(false)
      setTimeout(() => {
        onDisputeOpen(transactionId)
      }, 200)
    }
  }

  const generateReceiptText = () => {
    return `
═══════════════════════════════════════════
           CHASE BANK TRANSACTION RECEIPT
═══════════════════════════════════════════

Account Holder: ${userProfile?.name || "Lin Huang"}
Account Email: ${userProfile?.email || "linhuang011@gmail.com"}
Date: ${formatDate(transaction.date)}

───────────────────────────────────────────
                 TRANSACTION DETAILS
───────────────────────────────────────────

Status: ${transaction.status.toUpperCase()}
Reference ID: ${transaction.reference}

Amount: ${transaction.type === "debit" ? "-" : "+"}$${transaction.amount.toFixed(2)}
${transaction.fee ? `Fee: $${transaction.fee.toFixed(2)}` : ""}
${transaction.fee ? `Total: $${(transaction.amount + transaction.fee).toFixed(2)}` : ""}

Description: ${transaction.description}
Category: ${transaction.category}

${transaction.recipientName ? `Recipient: ${transaction.recipientName}` : ""}
${transaction.senderName ? `Sender: ${transaction.senderName}` : ""}
${transaction.accountFrom ? `From Account: ${transaction.accountFrom}` : ""}
${transaction.accountTo ? `To Account: ${transaction.accountTo}` : ""}
${transaction.bankName ? `Bank: ${transaction.bankName}` : ""}
${transaction.routingNumber ? `Routing: ${transaction.routingNumber}` : ""}

═══════════════════════════════════════════
        This is your official receipt.
     JPMorgan Chase Bank, N.A. Member FDIC
         Questions? Call 1-800-935-9935
═══════════════════════════════════════════
    `
  }

  const generateReceiptHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a4fa6, #117aca); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .logo { font-size: 24px; font-weight: bold; }
    .content { border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .status.completed { background: #dcfce7; color: #166534; }
    .status.pending { background: #fef9c3; color: #854d0e; }
    .status.failed { background: #fee2e2; color: #991b1b; }
    .amount { font-size: 32px; font-weight: bold; text-align: center; margin: 20px 0; }
    .amount.credit { color: #16a34a; }
    .amount.debit { color: #dc2626; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-label { color: #6b7280; font-size: 14px; }
    .detail-value { font-weight: 500; }
    .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">CHASE</div>
    <div>Transaction Receipt</div>
  </div>
  <div class="content">
    <div style="text-align: center; margin-bottom: 20px;">
      <span class="status ${transaction.status}">${transaction.status.toUpperCase()}</span>
    </div>
    <div class="amount ${transaction.type}">${transaction.type === "debit" ? "-" : "+"}$${transaction.amount.toFixed(2)}</div>
    ${transaction.fee ? `<div style="text-align: center; color: #6b7280; font-size: 14px;">+ $${transaction.fee.toFixed(2)} fee</div>` : ""}
    
    <div style="margin-top: 20px;">
      <div class="detail-row">
        <span class="detail-label">Account Holder</span>
        <span class="detail-value">${userProfile?.name || "Lin Huang"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email</span>
        <span class="detail-value">${userProfile?.email || "linhuang011@gmail.com"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Description</span>
        <span class="detail-value">${transaction.description}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time</span>
        <span class="detail-value">${formatDate(transaction.date)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Category</span>
        <span class="detail-value">${transaction.category}</span>
      </div>
      ${
        transaction.recipientName
          ? `
      <div class="detail-row">
        <span class="detail-label">Recipient</span>
        <span class="detail-value">${transaction.recipientName}</span>
      </div>`
          : ""
      }
      ${
        transaction.bankName
          ? `
      <div class="detail-row">
        <span class="detail-label">Bank</span>
        <span class="detail-value">${transaction.bankName}</span>
      </div>`
          : ""
      }
      <div class="detail-row">
        <span class="detail-label">Reference ID</span>
        <span class="detail-value" style="font-family: monospace;">${transaction.reference}</span>
      </div>
    </div>
  </div>
  <div class="footer">
    <p>JPMorgan Chase Bank, N.A. Member FDIC</p>
    <p>Questions? Call 1-800-935-9935</p>
  </div>
</body>
</html>
    `
  }

  const handleDownloadTxt = () => {
    const receiptText = generateReceiptText()
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(receiptText))
    element.setAttribute("download", `chase-receipt-${transaction.reference}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast({ title: "Receipt Downloaded", description: "Text receipt saved to your device." })
  }

  const handleDownloadPDF = () => {
    const receiptHTML = generateReceiptHTML()
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(receiptHTML)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
    toast({ title: "PDF Ready", description: "Use the print dialog to save as PDF." })
  }

  const handleShare = async () => {
    const shareText = `Chase Receipt: ${transaction.description} - $${transaction.amount.toFixed(2)} - Ref: ${transaction.reference}`
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

  const handleEmail = () => {
    setShowEmailForm(true)
  }

  const handleSendEmail = () => {
    setEmailSending(true)
    setTimeout(() => {
      const subject = encodeURIComponent(`Chase Receipt - ${transaction.reference}`)
      const body = encodeURIComponent(generateReceiptText())
      window.open(`mailto:${emailTo || userProfile?.email || "linhuang011@gmail.com"}?subject=${subject}&body=${body}`)
      setEmailSending(false)
      setShowEmailForm(false)
      setEmailTo("")
      toast({
        title: "Email Client Opened",
        description: `Receipt ready to send to ${emailTo || userProfile?.email || "linhuang011@gmail.com"}`,
      })
    }, 500)
  }

  const handlePrint = () => {
    const receiptHTML = generateReceiptHTML()
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(receiptHTML)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
    toast({ title: "Print Dialog Opened", description: "Ready to print your receipt." })
  }

  const handleSaveToDevice = () => {
    const savedReceipts = JSON.parse(localStorage.getItem("chase_saved_receipts") || "[]")
    if (!savedReceipts.find((r: any) => r.id === transaction.id)) {
      savedReceipts.push({
        id: transaction.id,
        reference: transaction.reference,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        category: transaction.category,
        status: transaction.status,
        recipientName: transaction.recipientName,
        accountFrom: transaction.accountFrom,
        accountTo: transaction.accountTo,
        bankName: transaction.bankName,
        fee: transaction.fee,
        savedAt: new Date().toISOString(),
      })
      localStorage.setItem("chase_saved_receipts", JSON.stringify(savedReceipts))
      setIsSaved(true)
      toast({ title: "Receipt Saved", description: "Receipt saved permanently to your device." })
    } else {
      // Remove from saved
      const updated = savedReceipts.filter((r: any) => r.id !== transaction.id)
      localStorage.setItem("chase_saved_receipts", JSON.stringify(updated))
      setIsSaved(false)
      toast({ title: "Receipt Removed", description: "Receipt removed from saved items." })
    }
  }

  const handleFavorite = () => {
    const favoriteReceipts = JSON.parse(localStorage.getItem("chase_favorite_receipts") || "[]")
    if (!favoriteReceipts.find((r: any) => r.id === transaction.id)) {
      favoriteReceipts.push({
        id: transaction.id,
        reference: transaction.reference,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        savedAt: new Date().toISOString(),
      })
      localStorage.setItem("chase_favorite_receipts", JSON.stringify(favoriteReceipts))
      setIsFavorite(true)
      toast({ title: "Added to Favorites", description: "Receipt added to your favorites." })
    } else {
      const updated = favoriteReceipts.filter((r: any) => r.id !== transaction.id)
      localStorage.setItem("chase_favorite_receipts", JSON.stringify(updated))
      setIsFavorite(false)
      toast({ title: "Removed from Favorites", description: "Receipt removed from favorites." })
    }
  }

  const handleSendSMS = () => {
    const message = encodeURIComponent(
      `Chase Receipt: ${transaction.description} - $${transaction.amount.toFixed(2)} - Ref: ${transaction.reference}`,
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-[#0a4fa6]">Transaction Receipt</DialogTitle>
          <button onClick={() => onOpenChange(false)} className="rounded-sm opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="text-center space-y-2">
            <div
              className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${transaction.status === "completed" ? "bg-green-100" : transaction.status === "pending" ? "bg-yellow-100" : "bg-red-100"}`}
            >
              {transaction.status === "completed" ? (
                <Check className="h-7 w-7 text-green-600" />
              ) : transaction.status === "pending" ? (
                <span className="text-xl text-yellow-600">⏱</span>
              ) : (
                <X className="h-7 w-7 text-red-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold capitalize">{transaction.status}</h3>
          </div>

          {/* Amount */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${transaction.type === "debit" ? "text-red-600" : "text-green-600"}`}>
              {transaction.type === "debit" ? "-" : "+"}${transaction.amount.toFixed(2)}
            </div>
            {transaction.fee ? (
              <p className="text-sm text-muted-foreground mt-1">+ ${transaction.fee.toFixed(2)} fee</p>
            ) : null}
          </div>

          {/* Details */}
          <div className="space-y-4 bg-muted/50 rounded-lg p-4">
            <div>
              <p className="text-xs text-muted-foreground">Account Holder</p>
              <p className="font-medium">{userProfile?.name || "Lin Huang"}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{userProfile?.email || "linhuang011@gmail.com"}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="font-medium">{transaction.description}</p>
            </div>

            {transaction.recipientName && (
              <div>
                <p className="text-xs text-muted-foreground">Recipient</p>
                <p className="font-medium">{transaction.recipientName}</p>
              </div>
            )}

            {transaction.senderName && (
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-medium">{transaction.senderName}</p>
              </div>
            )}

            {transaction.accountFrom && (
              <div>
                <p className="text-xs text-muted-foreground">From Account</p>
                <p className="font-medium">{transaction.accountFrom}</p>
              </div>
            )}

            {transaction.accountTo && (
              <div>
                <p className="text-xs text-muted-foreground">To Account</p>
                <p className="font-medium">{transaction.accountTo}</p>
              </div>
            )}

            {transaction.bankName && (
              <div>
                <p className="text-xs text-muted-foreground">Bank</p>
                <p className="font-medium">{transaction.bankName}</p>
              </div>
            )}

            {transaction.routingNumber && (
              <div>
                <p className="text-xs text-muted-foreground">Routing Number</p>
                <p className="font-medium font-mono">{transaction.routingNumber}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-medium">{transaction.category}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Date & Time</p>
              <p className="font-medium text-sm">{formatDate(transaction.date)}</p>
            </div>

            {transaction.reference && (
              <div>
                <p className="text-xs text-muted-foreground">Reference ID</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm">{transaction.reference}</p>
                  <button onClick={handleCopyReference} className="text-muted-foreground hover:text-foreground">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Email Form */}
          {showEmailForm && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
              <Label className="text-sm">Send receipt to email:</Label>
              <Input
                type="email"
                placeholder={userProfile?.email || "linhuang011@gmail.com"}
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={handleSendEmail} disabled={emailSending}>
                  {emailSending ? "Opening..." : "Send Email"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowEmailForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2">
          {/* Dispute Transaction button for debit transactions */}
          {transaction.type === "debit" && onDisputeOpen && (
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 mb-2 bg-transparent"
              onClick={handleDispute}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Dispute This Transaction
            </Button>
          )}

          {/* Primary Actions */}
          <div className="grid grid-cols-4 gap-2 w-full">
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 bg-transparent" onClick={handleEmail}>
              <Mail className="h-4 w-4 mb-1" />
              <span className="text-xs">Email</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`flex-col h-auto py-2 ${isSaved ? "bg-green-50 border-green-300" : "bg-transparent"}`}
              onClick={handleSaveToDevice}
            >
              {isSaved ? (
                <Bookmark className="h-4 w-4 mb-1 fill-green-600 text-green-600" />
              ) : (
                <Save className="h-4 w-4 mb-1" />
              )}
              <span className="text-xs">{isSaved ? "Saved" : "Save"}</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 bg-transparent" onClick={handleShare}>
              <Share2 className="h-4 w-4 mb-1" />
              <span className="text-xs">Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`flex-col h-auto py-2 ${isFavorite ? "bg-yellow-50 border-yellow-300" : "bg-transparent"}`}
              onClick={handleFavorite}
            >
              <Star className={`h-4 w-4 mb-1 ${isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`} />
              <span className="text-xs">{isFavorite ? "Faved" : "Fave"}</span>
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-4 gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-2 bg-transparent"
              onClick={handleDownloadTxt}
            >
              <FileText className="h-4 w-4 mb-1" />
              <span className="text-xs">TXT</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-2 bg-transparent"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4 mb-1" />
              <span className="text-xs">PDF</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 bg-transparent" onClick={handlePrint}>
              <Printer className="h-4 w-4 mb-1" />
              <span className="text-xs">Print</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-col h-auto py-2 bg-transparent" onClick={handleSendSMS}>
              <MessageSquare className="h-4 w-4 mb-1" />
              <span className="text-xs">SMS</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
