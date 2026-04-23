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
} from "lucide-react"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface TransactionReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string
}

export function TransactionReceiptModal({ open, onOpenChange, transactionId }: TransactionReceiptModalProps) {
  const { transactions, userProfile } = useBanking()
  const { toast } = useToast()
  const [isFavorite, setIsFavorite] = useState(false)

  const transaction = transactions.find((t) => t.id === transactionId)

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

Amount: ${transaction.type === "debit" ? "-" : "+"}$${(transaction.amount ?? 0).toFixed(2)}
${transaction.fee ? `Fee: $${(transaction.fee ?? 0).toFixed(2)}` : ""}
${transaction.fee ? `Total: $${((transaction.amount ?? 0) + (transaction.fee ?? 0)).toFixed(2)}` : ""}

Description: ${transaction.description}
Category: ${transaction.category}

${transaction.recipientName ? `Recipient: ${transaction.recipientName}` : ""}
${transaction.senderName ? `Sender: ${transaction.senderName}` : ""}
${transaction.accountFrom ? `From Account: ${transaction.accountFrom}` : ""}
${transaction.accountTo ? `To Account: ${transaction.accountTo}` : ""}
${transaction.bankName ? `Bank: ${transaction.bankName}` : ""}
${transaction.routingNumber ? `Routing: ${transaction.routingNumber}` : ""}

═══════════════════════════════════════════
          Thank you for banking with Chase
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
    <div class="amount ${transaction.type}">${transaction.type === "debit" ? "-" : "+"}$${(transaction.amount ?? 0).toFixed(2)}</div>
    ${transaction.fee ? `<div style="text-align: center; color: #6b7280; font-size: 14px;">+ $${(transaction.fee ?? 0).toFixed(2)} fee</div>` : ""}
    
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
        transaction.senderName
          ? `
      <div class="detail-row">
        <span class="detail-label">Sender</span>
        <span class="detail-value">${transaction.senderName}</span>
      </div>`
          : ""
      }
      <div class="detail-row">
        <span class="detail-label">Reference</span>
        <span class="detail-value">${transaction.reference}</span>
      </div>
    </div>
  </div>
  <div class="footer">
    <p>Thank you for banking with Chase</p>
    <p>© ${new Date().getFullYear()} JPMorgan Chase & Co.</p>
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
    toast({ title: "Reference Copied", description: `${transaction.reference} copied to clipboard.` })
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
              className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${getStatusColor(transaction.status)}`}
            >
              {getStatusIcon()}
            </div>
            <h3 className="text-lg font-semibold capitalize">{transaction.status}</h3>
          </div>

          <div className="text-center">
            <div className={`text-4xl font-bold ${transaction.type === "debit" ? "text-red-600" : "text-green-600"}`}>
              {transaction.type === "debit" ? "-" : "+"}${(transaction.amount ?? 0).toFixed(2)}
            </div>
            {transaction.fee ? (
              <p className="text-sm text-muted-foreground mt-1">+ ${(transaction.fee ?? 0).toFixed(2)} fee</p>
            ) : null}
          </div>

          {/* Details */}
          <div className="space-y-4 bg-muted/50 rounded-lg p-4">
            <div>
              <p className="text-xs text-muted-foreground">Account Holder</p>
              <p className="font-medium">{userProfile?.name || "Lin Huang"}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="font-medium">{transaction.description}</p>
            </div>

            <div className="flex justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(transaction.date)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium">{transaction.category}</p>
              </div>
            </div>

            {transaction.recipientName && (
              <div>
                <p className="text-xs text-muted-foreground">Recipient</p>
                <p className="font-medium">{transaction.recipientName}</p>
              </div>
            )}

            {transaction.senderName && (
              <div>
                <p className="text-xs text-muted-foreground">Sender</p>
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

            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Reference</p>
                <p className="font-medium font-mono text-sm">{transaction.reference}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyReference}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Transaction Type Icon */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            {transaction.type === "debit" ? (
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            ) : (
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
            )}
            <span className="text-sm capitalize">{transaction.type} Transaction</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-col h-auto py-3 bg-transparent"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4 mb-1" />
              <span className="text-xs">Download</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-col h-auto py-3 bg-transparent" onClick={handlePrint}>
              <Printer className="h-4 w-4 mb-1" />
              <span className="text-xs">Print</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-col h-auto py-3 bg-transparent">
                  <Share2 className="h-4 w-4 mb-1" />
                  <span className="text-xs">Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleShare}>
                  <FileText className="h-4 w-4 mr-2" />
                  Copy to clipboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEmailReceipt}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email receipt
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendSMS}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send via SMS
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className={`flex-col h-auto py-3 ${isFavorite ? "text-yellow-500" : ""}`}
              onClick={handleToggleFavorite}
            >
              <Star className={`h-4 w-4 mb-1 ${isFavorite ? "fill-yellow-500" : ""}`} />
              <span className="text-xs">Save</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
