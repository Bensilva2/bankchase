"use client"

import { useState, useEffect, useCallback } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useBanking, CUSTOMER_SERVICE_EMAIL, VERIFICATION_CODES } from "@/lib/banking-context"
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

type VerificationStep = "form" | "review" | "otp" | "cot" | "tax" | "processing" | "complete" | "success"

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
  const { addTransaction, accounts, userProfile, addNotification, addActivity, updateTransaction, sendMessage } =
    useBanking()
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

  // State for recipient details to be used in sendMessage
  const beneficiaryName = recipientName
  const beneficiaryBank = recipientBank
  const beneficiaryAccount = accountNumber

  // Simulating state.user for sendMessage
  const state = { user: userProfile }

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

  const sendOTPEmail = useCallback(
    (otpCode: string) => {
      sendMessage({
        from: "Chase Wire Transfer Department",
        subject: "Wire Transfer OTP Verification Code",
        preview: `Your OTP code for wire transfer verification`,
        content: `Dear ${userProfile.name},\n\nYour One-Time Password (OTP) for wire transfer verification is:\n\n${otpCode}\n\nThis code has been sent to our customer service team at ${CUSTOMER_SERVICE_EMAIL} for verification.\n\nTransaction Details:\n- Amount: $${amount}\n- To: ${recipientName}\n- Bank: ${recipientBank}\n\nPlease enter this code in the verification step to complete your wire transfer.\n\nThis code is valid for 10 minutes.\n\nIf you did not initiate this wire transfer, please contact us immediately.\n\nBest regards,\nChase Wire Transfer Department`,
        category: "Security",
        hasAttachments: false,
      })

      toast({
        title: "Verification Code Sent",
        description: `OTP code has been sent to customer service at ${CUSTOMER_SERVICE_EMAIL}`,
      })
    },
    [sendMessage, userProfile, recipientName, recipientBank, amount, toast],
  )

  const sendCOTEmail = useCallback(
    (cotCode: string) => {
      sendMessage({
        from: "Chase Wire Transfer Compliance",
        subject: "Cost of Transfer (COT) Verification Code",
        preview: `Your COT code for wire transfer`,
        content: `Dear ${userProfile.name},\n\nYour Cost of Transfer (COT) code for wire transfer verification is:\n\n${cotCode}\n\nThis code has been sent to our customer service team at ${CUSTOMER_SERVICE_EMAIL} for compliance verification.\n\nTransaction Details:\n- Amount: $${amount}\n- Recipient: ${recipientName}\n- Bank: ${recipientBank}\n- Wire Type: ${wireType === "domestic" ? "Domestic" : "International"}\n\nThe COT code is required for high-value wire transfers to ensure compliance with banking regulations and anti-money laundering (AML) requirements.\n\nPlease enter this code in the verification step to continue processing your wire transfer.\n\nIf you have any questions or did not initiate this transfer, please contact us immediately at 1-800-935-9935.\n\nBest regards,\nChase Wire Transfer Compliance Department`,
        category: "Security",
        hasAttachments: false,
      })

      toast({
        title: "COT Code Sent",
        description: `COT code has been sent to customer service at ${CUSTOMER_SERVICE_EMAIL}`,
      })
    },
    [sendMessage, userProfile, recipientName, recipientBank, amount, wireType, toast],
  )

  const handleProceedToOTP = () => {
    setCurrentStep("otp")
    setOtpResendTimer(60)

    // Send OTP to customer service email only
    sendOTPEmail(VERIFICATION_CODES.OTP)

    // Add activity log without showing the code
    addActivity({
      type: "Wire Transfer OTP",
      description: `Wire transfer OTP code sent to customer service at ${CUSTOMER_SERVICE_EMAIL}`,
      status: "success",
    })
  }

  const handleVerifyOTP = () => {
    setIsLoading(true)
    setOtpError("")

    setTimeout(() => {
      setIsLoading(false)
      if (otpCode !== VERIFICATION_CODES.OTP) {
        setOtpError("Invalid OTP code. Please enter the correct code.")
        return
      }

      setOtpError("")

      addActivity({
        action: "Wire Transfer OTP Verified",
        device: "Current Device",
        location: "New York, NY",
      })

      sendCOTEmail(VERIFICATION_CODES.COT)

      setCurrentStep("cot")
      toast({
        title: "OTP Verified",
        description: "COT code has been sent to customer service. Please enter the code to proceed.",
      })
    }, 1500)
  }

  const handleVerifyCOT = () => {
    setIsLoading(true)
    setCotError("")

    setTimeout(() => {
      setIsLoading(false)
      if (cotCode !== VERIFICATION_CODES.COT) {
        setCotError("Invalid COT code. Please enter the correct code.")
        return
      }

      setCotError("")

      addActivity({
        action: "Wire Transfer COT Verified",
        device: "Current Device",
        location: "New York, NY",
      })

      sendMessage({
        from: "Chase Tax Compliance Department",
        subject: "Wire Transfer Tax Clearance Code",
        preview: `Your Tax Clearance code for wire transfer`,
        content: `Dear ${userProfile.name},\n\nYour Tax Clearance Certificate code for wire transfer verification is:\n\n${VERIFICATION_CODES.TAX}\n\nThis code has been sent to our customer service team at ${CUSTOMER_SERVICE_EMAIL} for tax compliance verification.\n\nTransaction Details:\n- Amount: $${amount}\n- Recipient: ${recipientName}\n- Bank: ${recipientBank}\n\nThe Tax Clearance Certificate is required to ensure compliance with financial regulations and anti-money laundering (AML) requirements.\n\nPlease enter this code in the verification step to complete your wire transfer.\n\nIf you have any questions, please contact us at 1-800-935-9935.\n\nBest regards,\nChase Tax Compliance Department`,
        category: "Security",
        hasAttachments: false,
      })

      setCurrentStep("tax")
      toast({
        title: "COT Code Verified",
        description: "Tax Clearance code has been sent to customer service. Please enter the code to proceed.",
      })
    }, 1500)
  }

  const handleVerifyTax = () => {
    setIsLoading(true)
    setTaxError("")

    setTimeout(() => {
      setIsLoading(false)
      if (taxCode !== VERIFICATION_CODES.TAX) {
        setTaxError("Invalid Tax Clearance Certificate code. Please enter the correct code.")
        return
      }

      setTaxError("")

      addActivity({
        action: "Wire Transfer Tax Verified",
        device: "Current Device",
        location: "New York, NY",
      })

      sendMessage({
        from: "Chase Wire Transfer Department",
        subject: "Wire Transfer Tax Clearance Verified",
        preview: "Tax Clearance Certificate has been successfully verified",
        content: `Dear ${userProfile.name},\n\nTax Clearance Certificate has been successfully verified for your wire transfer:\n\nTransaction Details:\n- Tax Code: Verified ✓\n- Amount: $${amount}\n- Recipient: ${recipientName}\n- Bank: ${recipientBank}\n- Status: Processing Transfer\n\nAll verification steps completed. Your wire transfer is now being processed.\n\nYou will receive a confirmation once the transfer is complete.\n\nBest regards,\nChase Wire Transfer Department`,
        category: "Security",
        hasAttachments: false,
      })

      initiateWireTransfer()

      toast({
        title: "Tax Code Verified",
        description: "Processing your wire transfer. This may take a few moments.",
      })
    }, 1500)
  }

  // Mock transferFunds function for demonstration
  const transferFunds = (fromAccount: any, amount: number) => {
    console.log(`Transferring $${amount.toLocaleString()} from ${fromAccount.name} (${fromAccount.id})`)
    // In a real app, this would involve API calls to your backend to debit the account and credit the recipient.
    // For this simulation, we'll just log the action.
  }

  const handleResendOTP = () => {
    setOtpResendTimer(60)
    setOtpCode("")

    // Resend OTP to customer service email only
    sendOTPEmail(VERIFICATION_CODES.OTP)

    // Add activity log without showing the code
    addActivity({
      type: "Wire Transfer OTP Resend",
      description: `Wire transfer OTP code resent to customer service at ${CUSTOMER_SERVICE_EMAIL}`,
      status: "success",
    })
  }

  const initiateWireTransfer = () => {
    const fromAccount = accounts.find((a) => a.id === selectedAccount)
    if (!fromAccount) return

    // Generate confirmation number
    const confNum = `WIRE${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    setConfirmationNumber(confNum)

    const transaction = addTransaction({
      description: `Wire Transfer to ${recipientName}`,
      amount: getTotalAmount(),
      type: "debit",
      category: "Wire Transfer",
      status: "completed",
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

    // Add activity - Updated to use $
    addActivity({
      action: `Wire Transfer initiated: $${getTransferAmount().toFixed(2)} to ${recipientName}`,
      device: "Current Device",
      location: "New York, NY",
    })

    // Add notification - Updated to use $
    addNotification({
      title: "Wire Transfer Initiated",
      message: `Your wire transfer of $${getTransferAmount().toFixed(2)} to ${recipientName} is being processed. Confirmation: ${confNum}`,
      type: "info",
      category: "Transactions",
    })
  }

  const completeTransaction = () => {
    setCurrentStep("complete")

    // Add completion notification - Updated to use $
    addNotification({
      title: "Wire Transfer Pending",
      message: `Your wire transfer of $${getTransferAmount().toFixed(2)} to ${recipientName} has been submitted and is pending. Expected completion: 1-3 business days.`,
      type: "success",
      category: "Transactions",
    })

    // Add activity - Updated to use $
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
Transfer Amount: $${getTransferAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}
Wire Fee: $${getFee().toFixed(2)}
Total: $${getTotalAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}

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
      case "success": // Add case for success step
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
  const renderOTPStep = () => {
    const [assistantOpen, setAssistantOpen] = useState(false)
    const [assistantMessages, setAssistantMessages] = useState<Array<{ id: string; text: string; sender: "user" | "assistant"; timestamp: Date }>>([
      {
        id: "1",
        text: "Hello! I'm Chase Virtual Assistant. How can I help you with your wire transfer?",
        sender: "assistant",
        timestamp: new Date(),
      },
    ])
    const [assistantInput, setAssistantInput] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
      scrollToBottom()
    }, [assistantMessages])

    const handleSendMessage = () => {
      if (!assistantInput.trim()) return

      const userMessage = {
        id: Date.now().toString(),
        text: assistantInput,
        sender: "user" as const,
        timestamp: new Date(),
      }

      setAssistantMessages((prev) => [...prev, userMessage])
      setAssistantInput("")

      setTimeout(() => {
        const responses: Record<string, string> = {
          otp: "Your OTP code has been sent to our customer service team. Please contact support at 1-800-935-9935 or email support@chase.com to request your verification code.",
          code: "The OTP verification code is required for security. Contact our support team to verify your identity and receive the code.",
          help: "I can help you with OTP verification, wire transfer details, or general questions. What do you need assistance with?",
          support: "For immediate assistance, please call our customer service team at 1-800-935-9935 or email support@chase.com",
          default: "I'm here to help! Please let me know what information you need regarding your wire transfer or OTP verification.",
        }

        const lowerInput = assistantInput.toLowerCase()
        let response = responses.default

        if (lowerInput.includes("otp") || lowerInput.includes("code")) {
          response = responses.otp
        } else if (lowerInput.includes("help")) {
          response = responses.help
        } else if (lowerInput.includes("support") || lowerInput.includes("contact")) {
          response = responses.support
        }

        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          text: response,
          sender: "assistant" as const,
          timestamp: new Date(),
        }

        setAssistantMessages((prev) => [...prev, assistantMessage])
      }, 600)
    }

    return (
      <div className="px-4 space-y-6 overflow-y-auto pb-4">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Wire Transfer, OTP Code Sent</h2>
          <p className="text-sm text-muted-foreground">Enter your 6-digit verification code</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-sm">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📧 OTP Code Sent</h4>
          <p className="text-blue-800 dark:text-blue-200 text-xs">
            Your OTP verification code has been sent to our customer service team. Please contact help and support or use Chase Virtual Assistant below for assistance.
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

        <div className="border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-[#0a4fa6]">Chase Virtual Assistant</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAssistantOpen(!assistantOpen)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              {assistantOpen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </Button>
          </div>

          {assistantOpen && (
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-900 rounded border h-48 overflow-y-auto p-3 space-y-3">
                {assistantMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.sender === "user"
                          ? "bg-[#0a4fa6] text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Ask a question..."
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage()
                    }
                  }}
                  className="text-sm h-9"
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  className="bg-[#0a4fa6] hover:bg-[#083d80] text-white h-9 px-3"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-muted/50 p-4 rounded-lg text-xs space-y-2">
          <p className="font-semibold text-foreground">Contact Help and Support:</p>
          <div className="space-y-1">
            <p className="text-muted-foreground">
              Email:{" "}
              <a href={`mailto:${CUSTOMER_SERVICE_EMAIL}`} className="text-[#0a4fa6] font-medium hover:underline">
                {CUSTOMER_SERVICE_EMAIL}
              </a>
            </p>
            <p className="text-muted-foreground">
              Phone: <span className="font-medium text-foreground">1-800-935-9935</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // COT Step
  const renderCOTStep = () => (
    <div className="px-4 space-y-6 overflow-y-auto pb-4">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-600 font-medium">OTP Verified Successfully</span>
        </div>
        <h3 className="font-semibold text-lg">Cost of Transfer (COT) Code</h3>
        <p className="text-sm text-muted-foreground mt-1">Enter your COT code to continue verification</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-sm">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📧 COT Code Sent</h4>
        <p className="text-blue-800 dark:text-blue-200 text-xs">
          Your COT verification code has been sent to our customer service team at{" "}
          <span className="font-semibold">{CUSTOMER_SERVICE_EMAIL}</span>. Please contact them to receive your code.
        </p>
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

        <div className="bg-muted/50 p-4 rounded-lg text-sm">
          <h4 className="font-medium mb-2">What is a COT Code?</h4>
          <p className="text-muted-foreground text-xs">
            The Cost of Transfer (COT) code is a security verification code required for high-value wire transfers. This
            code ensures that the transfer is authorized and compliant with banking regulations.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg text-sm space-y-3">
          <h4 className="font-medium text-amber-900 dark:text-amber-100">Didn't receive the code?</h4>
          <ul className="text-amber-800 dark:text-amber-200 text-xs space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Check your email inbox and spam folder</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Check your phone for SMS notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Contact Customer Support for assistance</span>
            </li>
          </ul>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Contact Customer Support:</p>
          <p>
            Email:{" "}
            <a href={`mailto:${CUSTOMER_SERVICE_EMAIL}`} className="text-[#0a4fa6] hover:underline">
              {CUSTOMER_SERVICE_EMAIL}
            </a>
          </p>
          <p>Phone: 1-800-935-9935</p>
        </div>
      </div>
    </div>
  )

  // Tax Clearance Step
  const renderTaxStep = () => (
    <div className="px-4 space-y-6 overflow-y-auto pb-4">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-600 font-medium">COT Verified Successfully</span>
        </div>
        <h3 className="font-semibold text-lg">Tax Clearance Verification</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your Tax Clearance Certificate code to complete verification
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-sm">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📧 Tax Code Sent</h4>
        <p className="text-blue-800 dark:text-blue-200 text-xs">
          Your Tax Clearance Certificate code has been sent to our customer service team at{" "}
          <span className="font-semibold">{CUSTOMER_SERVICE_EMAIL}</span>. Please contact them to receive your code.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Tax Clearance Certificate Code</Label>
          <Input
            type="text"
            placeholder="Enter Tax Code (e.g., HM36RC)"
            value={taxCode}
            onChange={(e) => {
              setTaxCode(e.target.value.toUpperCase())
              setTaxError("")
            }}
            className="mt-1.5 text-center font-mono text-lg tracking-wider"
            maxLength={6}
          />
          {taxError && <p className="text-sm text-destructive mt-2">{taxError}</p>}
        </div>

        <div className="bg-muted/50 p-4 rounded-lg text-sm">
          <h4 className="font-medium mb-2">Tax Clearance Required</h4>
          <p className="text-muted-foreground text-xs">
            For compliance with financial regulations, wire transfers require tax clearance verification. This ensures
            the funds are legally cleared for transfer and comply with anti-money laundering (AML) requirements.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg text-sm space-y-3">
          <h4 className="font-medium text-amber-900 dark:text-amber-100">Didn't receive the code?</h4>
          <ul className="text-amber-800 dark:text-amber-200 text-xs space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Check your email inbox and spam folder</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Check your phone for SMS notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Contact Customer Support for assistance</span>
            </li>
          </ul>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Contact Customer Support:</p>
          <p>
            Email:{" "}
            <a href={`mailto:${CUSTOMER_SERVICE_EMAIL}`} className="text-[#0a4fa6] hover:underline">
              {CUSTOMER_SERVICE_EMAIL}
            </a>
          </p>
          <p>Phone: 1-800-935-9935</p>
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

  // Success Step (newly added based on the update)
  const renderSuccessStep = () => (
    <div className="px-4 py-6 space-y-6 overflow-y-auto pb-4">
      <div className="text-center">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="font-semibold text-xl">Wire Transfer Complete</h3>
        <p className="text-sm text-muted-foreground mt-1">Your transfer has been successfully processed.</p>
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
          <span className="font-medium">Total Debited</span>
          <span className="font-bold">${getTotalAmount().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm pt-2">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium text-green-600">Completed</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="bg-transparent" onClick={downloadReceipt}>
          <Download className="h-4 w-4 mr-2" />
          Download Receipt
        </Button>
        <Button variant="outline" className="bg-transparent" onClick={handleViewReceipt}>
          <FileText className="h-4 w-4 mr-2" />
          View Receipt
        </Button>
      </div>

      <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground text-center">
        <p>Your wire transfer has been successfully processed.</p>
        <p className="mt-1">You can find detailed information in your transaction history.</p>
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
      case "success": // Render the success step
        return renderSuccessStep()
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
              disabled={isLoading || taxCode.length < 8} // Changed length check to 8 as per mock data, could be adjusted
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
      case "success": // Footer for the success step
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
            {currentStep !== "form" &&
              currentStep !== "processing" &&
              currentStep !== "complete" &&
              currentStep !== "success" && (
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
