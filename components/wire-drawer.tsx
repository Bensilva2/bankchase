"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  Minimize2,
  MessageCircle,
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
  const { addTransaction, accounts, userProfile, addNotification, addActivity, updateTransaction, addMessage } =
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
  const [isDrawerReady, setIsDrawerReady] = useState(false)

  // Virtual Assistant state (must be declared before useEffects that reference them)
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
  const [isAssistantLoading, setIsAssistantLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const assistantMessagesEndRef = useRef<HTMLDivElement>(null)

  // Preload data when drawer opens
  useEffect(() => {
    if (open) {
      setIsDrawerReady(true)
    } else {
      setIsDrawerReady(false)
      setCurrentStep("form")
      setRecipientName("")
      setRecipientBank("")
      setRoutingNumber("")
      setAccountNumber("")
      setAmount("")
      setWireType("domestic")
    }
  }, [open])

  // Auto-scroll assistant messages
  useEffect(() => {
    assistantMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [assistantMessages])

  // Auto-scroll main messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [assistantMessages])

  // State for recipient details to be used in addMessage
  const beneficiaryName = recipientName
  const beneficiaryBank = recipientBank
  const beneficiaryAccount = accountNumber

  // Simulating state.user for addMessage
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

  // Scroll to bottom of assistant messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [assistantMessages, scrollToBottom])

  // Handle assistant message send
  const handleAssistantSendMessage = useCallback(() => {
    if (!assistantInput.trim() || isAssistantLoading) return

    const userMessage = {
      id: Date.now().toString(),
      text: assistantInput,
      sender: "user" as const,
      timestamp: new Date(),
    }

    setAssistantMessages((prev) => [...prev, userMessage])
    const currentInput = assistantInput
    setAssistantInput("")
    setIsAssistantLoading(true)

    setTimeout(() => {
      const responses: Record<string, string> = {
        // OTP related
        otp: "Your OTP (One-Time Password) code has been sent to our customer service team. Please contact support at chase.org_info247@zohomail.com to request your verification code. The code is valid for 10 minutes.",
        "what is otp": "OTP stands for One-Time Password. It's a 6-digit security code sent to verify your identity before processing wire transfers. This adds an extra layer of protection to your account.",
        "otp not received": "If you haven't received your OTP code: 1) Wait 2-3 minutes as delivery may be delayed, 2) Check your spam/junk folder, 3) Click 'Resend Code' to get a new one, or 4) Contact our support team at chase.org_info247@zohomail.com.",
        "resend otp": "You can resend your OTP code by clicking the 'Resend Code' button below the verification input. If the timer is active, please wait for it to expire before requesting a new code.",
        
        // COT related
        cot: "Your COT (Cost of Transfer) code has been sent to customer service. The COT code is required for high-value wire transfers to ensure compliance with banking regulations. Contact support at chase.org_info247@zohomail.com to receive your code.",
        "what is cot": "COT stands for Cost of Transfer. It's a security verification code required for high-value wire transfers to ensure the transaction is authorized and compliant with anti-money laundering (AML) regulations.",
        "cot not received": "If you haven't received your COT code: 1) Check your email inbox and spam folder, 2) Wait a few minutes for delivery, 3) Contact our customer service team at chase.org_info247@zohomail.com for immediate assistance.",
        "why cot": "The COT code is required to verify that you authorize this high-value transfer and to comply with federal banking regulations. This helps protect your funds and prevents unauthorized transactions.",
        
        // Tax related
        tax: "Your Tax Clearance Certificate code has been sent to customer service. This code ensures your transfer complies with financial regulations. Contact support at chase.org_info247@zohomail.com to receive your code.",
        "what is tax": "The Tax Clearance Certificate code is required for compliance with financial regulations and anti-money laundering (AML) requirements. It verifies that the funds are legally cleared for transfer.",
        "tax not received": "If you haven't received your Tax code: 1) Check your email inbox and spam folder, 2) Wait a few minutes for delivery, 3) Contact our customer service team at chase.org_info247@zohomail.com for immediate assistance.",
        "why tax": "Tax clearance verification is required by federal regulations for wire transfers to ensure funds are properly documented and comply with reporting requirements.",
        
        // General
        help: "I can help you with: 1) OTP verification questions, 2) COT code assistance, 3) Tax clearance information, 4) Wire transfer status, 5) Contact support. What would you like to know?",
        support: "For immediate assistance, please email our customer service team at chase.org_info247@zohomail.com. Our team is available to help you with any questions.",
        status: "Your wire transfer is currently in the verification stage. Once all verification codes are entered correctly, your transfer will be processed. Typical processing time is 1-3 business days.",
        fee: "Wire transfer fees vary by type: Domestic transfers: $25, International transfers: $45. These fees are automatically calculated and shown in your transfer summary.",
        cancel: "To cancel this wire transfer, simply close this window before completing verification. Once all verification codes are entered and the transfer is submitted, cancellation may require contacting customer service at chase.org_info247@zohomail.com.",
        secure: "Your wire transfer is protected by multiple security layers including OTP verification, COT codes, and tax clearance. All data is encrypted and your funds are FDIC insured.",
        default: "I'm here to help with your wire transfer verification! You can ask me about OTP codes, COT verification, tax clearance, transfer fees, or contact support. What would you like to know?",
      }

      const lowerInput = currentInput.toLowerCase()
      let response = responses.default

      // Check for specific phrases first
      if (lowerInput.includes("what is otp") || lowerInput.includes("what's otp")) {
        response = responses["what is otp"]
      } else if (lowerInput.includes("what is cot") || lowerInput.includes("what's cot")) {
        response = responses["what is cot"]
      } else if (lowerInput.includes("what is tax") || lowerInput.includes("what's tax")) {
        response = responses["what is tax"]
      } else if (lowerInput.includes("why") && lowerInput.includes("cot")) {
        response = responses["why cot"]
      } else if (lowerInput.includes("why") && lowerInput.includes("tax")) {
        response = responses["why tax"]
      } else if (lowerInput.includes("not received") || lowerInput.includes("didn't receive") || lowerInput.includes("no code")) {
        if (lowerInput.includes("otp")) {
          response = responses["otp not received"]
        } else if (lowerInput.includes("cot")) {
          response = responses["cot not received"]
        } else if (lowerInput.includes("tax")) {
          response = responses["tax not received"]
        } else {
          response = "If you haven't received your verification code, please check your email (including spam), wait a few minutes, or contact support at chase.org_info247@zohomail.com."
        }
      } else if (lowerInput.includes("resend")) {
        response = responses["resend otp"]
      } else if (lowerInput.includes("otp") || lowerInput.includes("one time") || lowerInput.includes("6 digit")) {
        response = responses.otp
      } else if (lowerInput.includes("cot") || lowerInput.includes("cost of transfer")) {
        response = responses.cot
      } else if (lowerInput.includes("tax") || lowerInput.includes("clearance")) {
        response = responses.tax
      } else if (lowerInput.includes("help") || lowerInput.includes("assist")) {
        response = responses.help
      } else if (lowerInput.includes("support") || lowerInput.includes("contact") || lowerInput.includes("email")) {
        response = responses.support
      } else if (lowerInput.includes("status") || lowerInput.includes("how long") || lowerInput.includes("when")) {
        response = responses.status
      } else if (lowerInput.includes("fee") || lowerInput.includes("cost") || lowerInput.includes("charge")) {
        response = responses.fee
      } else if (lowerInput.includes("cancel") || lowerInput.includes("stop")) {
        response = responses.cancel
      } else if (lowerInput.includes("secure") || lowerInput.includes("safe") || lowerInput.includes("security")) {
        response = responses.secure
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "assistant" as const,
        timestamp: new Date(),
      }

      setAssistantMessages((prev) => [...prev, assistantMessage])
      setIsAssistantLoading(false)
    }, 600)
  }, [assistantInput, isAssistantLoading])

  // Handle quick question click - opens assistant and sends the question
  const handleQuickQuestion = useCallback((question: string) => {
    setAssistantOpen(true)
    setIsAssistantLoading(true)
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: question,
      sender: "user" as const,
      timestamp: new Date(),
    }
    setAssistantMessages((prev) => [...prev, userMessage])

    // Process and respond
    setTimeout(() => {
      const responses: Record<string, string> = {
        // OTP questions
        "What is an OTP code?": "OTP stands for One-Time Password. It's a 6-digit security code sent to verify your identity before processing wire transfers. This adds an extra layer of protection to your account and ensures only you can authorize transfers.",
        "Where is my OTP code?": "Your OTP code has been sent to our customer service team for security verification. Please contact support at chase.org_info247@zohomail.com to receive your code. Have your account details ready for verification.",
        "How do I resend the OTP?": "You can resend your OTP code by clicking the 'Resend Code' button below the verification input. If the timer is active, please wait for it to expire (usually 60 seconds) before requesting a new code.",
        "Why do I need OTP verification?": "OTP verification adds an extra layer of security to protect your funds. It ensures that only you can authorize wire transfers from your account, even if someone else has access to your login credentials.",
        
        // COT questions
        "What is a COT code?": "COT stands for Cost of Transfer. It's a security verification code required for high-value wire transfers to ensure the transaction is authorized and compliant with anti-money laundering (AML) regulations.",
        "Where is my COT code?": "Your COT code has been sent to our customer service team. Please contact support at chase.org_info247@zohomail.com to receive your code. You'll need to verify your identity.",
        "Why is COT required?": "The COT code is required to verify that you authorize this high-value transfer and to comply with federal banking regulations. This helps protect your funds and prevents unauthorized transactions.",
        "How long is COT valid?": "Your COT code is valid for 24 hours from the time it was generated. If you don't complete verification within this time, you'll need to request a new code.",
        
        // Tax questions
        "What is Tax Clearance?": "The Tax Clearance Certificate code is required for compliance with financial regulations and anti-money laundering (AML) requirements. It verifies that the funds are legally cleared for transfer.",
        "Where is my Tax code?": "Your Tax Clearance Certificate code has been sent to our customer service team. Please contact support at chase.org_info247@zohomail.com to receive your code.",
        "Why is Tax Clearance needed?": "Tax clearance verification is required by federal regulations for wire transfers to ensure funds are properly documented and comply with IRS reporting requirements for large transfers.",
        "Is my transfer secure?": "Yes! Your wire transfer is protected by multiple security layers including OTP verification, COT codes, and tax clearance. All data is encrypted with 256-bit SSL, and your funds are FDIC insured up to $250,000.",
      }

      const response = responses[question] || "I'm here to help! Please contact our support team at chase.org_info247@zohomail.com for personalized assistance with your question."

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "assistant" as const,
        timestamp: new Date(),
      }
      setAssistantMessages((prev) => [...prev, assistantMessage])
      setIsAssistantLoading(false)
    }, 800)
  }, [])

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
    // Reset assistant state
    setAssistantOpen(false)
    setAssistantMessages([
      {
        id: "1",
        text: "Hello! I'm Chase Virtual Assistant. How can I help you with your wire transfer?",
        sender: "assistant",
        timestamp: new Date(),
      },
    ])
    setAssistantInput("")
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

  const sendOTPEmail = useCallback(async () => {
    try {
      // Send verification code to customer service email only
      const response = await fetch("/api/email/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: CUSTOMER_SERVICE_EMAIL,
          subject: "Wire Transfer OTP Verification Code",
          type: "otp",
          userName: userProfile.name,
          amount,
          recipientName,
          recipientBank,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error("Failed to send verification code")

      // Send generic message to inbox (WITHOUT showing actual code)
      addMessage({
        from: "Chase Security Department",
        subject: "Wire Transfer Verification Initiated",
        preview: "Your wire transfer verification has been initiated",
        content: `Dear ${userProfile.name},\n\nYour wire transfer verification code has been securely sent to our customer service team at ${CUSTOMER_SERVICE_EMAIL}.\n\nTransaction Details:\n- Amount: $${amount}\n- Recipient: ${recipientName}\n- Bank: ${recipientBank}\n\nOur team will contact you via secure channels to provide your verification code.\n\nFor security reasons, we never share verification codes via email.\n\nIf you have questions, contact us at ${CUSTOMER_SERVICE_EMAIL}.\n\nBest regards,\nChase Security Department`,
        category: "Security",
        hasAttachments: false,
      })

      toast({
        title: "Verification Code Sent",
        description: "Security code sent to our team. You will receive it via secure channel.",
      })
    } catch (error) {
      console.error("Error sending OTP:", error)
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      })
    }
  }, [addMessage, userProfile, recipientName, recipientBank, amount, toast])

  const sendCOTEmail = useCallback(async () => {
    try {
      // Send verification code to customer service email only
      const response = await fetch("/api/email/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: CUSTOMER_SERVICE_EMAIL,
          subject: "Cost of Transfer (COT) Verification Code",
          type: "cot",
          userName: userProfile.name,
          amount,
          recipientName,
          recipientBank,
          wireType,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error("Failed to send COT code")

      // Send generic message to inbox (WITHOUT showing actual code)
      addMessage({
        from: "Chase Compliance Department",
        subject: "Cost of Transfer Verification",
        preview: "Your COT verification code is ready",
        content: `Dear ${userProfile.name},\n\nYour Cost of Transfer (COT) verification code has been securely sent to our compliance team at ${CUSTOMER_SERVICE_EMAIL}.\n\nTransaction Details:\n- Amount: $${amount}\n- Recipient: ${recipientName}\n- Bank: ${recipientBank}\n- Wire Type: ${wireType === "domestic" ? "Domestic" : "International"}\n\nThis code is required for compliance with banking regulations and anti-money laundering requirements.\n\nOur team will contact you via secure channels to provide your verification code.\n\nFor your security, verification codes are never shared via email.\n\nBest regards,\nChase Compliance Department`,
        category: "Security",
        hasAttachments: false,
      })

      toast({
        title: "COT Code Sent",
        description: "Cost of Transfer code sent to our compliance team via secure channel.",
      })
    } catch (error) {
      console.error("Error sending COT code:", error)
      toast({
        title: "Error",
        description: "Failed to send COT code. Please try again.",
        variant: "destructive",
      })
    }
  }, [addMessage, userProfile, recipientName, recipientBank, amount, wireType, toast])

  const handleProceedToOTP = () => {
    setCurrentStep("otp")
    setOtpResendTimer(60)

    // Send OTP to customer service email (code not exposed to user)
    sendOTPEmail()

    // Add activity log without showing the code
    addActivity({
      type: "Wire Transfer OTP",
      description: `Wire transfer verification code sent to customer service at ${CUSTOMER_SERVICE_EMAIL}`,
      status: "success",
    })

    // Real-time notification (does not mention specific code)
    addNotification?.({
      title: "Verification Code Sent",
      message: `Security code has been sent for wire transfer of $${parseFloat(amount).toLocaleString()} to ${recipientName}. You will receive it via secure channel.`,
      type: "info",
      category: "Transfers",
    })
  }

  const handleVerifyOTP = () => {
    setIsLoading(true)
    setOtpError("")

    setTimeout(() => {
      setIsLoading(false)
      if (otpCode !== VERIFICATION_CODES.OTP) {
        setOtpError("Invalid OTP code. Please enter the correct code.")
        addNotification?.({
          title: "OTP Verification Failed",
          message: "Invalid OTP code entered for wire transfer verification.",
          type: "alert",
          category: "Security",
        })
        return
      }

      setOtpError("")

      addActivity({
        action: "Wire Transfer OTP Verified",
        device: "Current Device",
        location: "New York, NY",
      })

      addNotification?.({
        title: "OTP Verified Successfully",
        message: `Wire transfer OTP verified. Cost of Transfer code sent to ${CUSTOMER_SERVICE_EMAIL}.`,
        type: "success",
        category: "Security",
      })

      sendCOTEmail()

      setCurrentStep("cot")
      toast({
        title: "OTP Verified",
        description: "Cost of Transfer code has been sent to customer service via secure channel.",
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
        addNotification?.({
          title: "COT Verification Failed",
          message: "Invalid COT code entered for wire transfer verification.",
          type: "alert",
          category: "Security",
        })
        return
      }

      setCotError("")

      addActivity({
        action: "Wire Transfer COT Verified",
        device: "Current Device",
        location: "New York, NY",
      })

      addNotification?.({
        title: "COT Code Verified",
        message: `Wire transfer COT verified. Tax Clearance code sent to ${CUSTOMER_SERVICE_EMAIL}.`,
        type: "success",
        category: "Security",
      })

      addMessage({
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
        description: "Tax Clearance code has been sent to customer service via secure channel.",
      })
      
      // Send Tax code to customer service email
      sendTaxEmail()
    }, 1500)
  }

  const sendTaxEmail = useCallback(async () => {
    try {
      // Send verification code to customer service email only
      const response = await fetch("/api/email/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: CUSTOMER_SERVICE_EMAIL,
          subject: "Tax Clearance Certificate Verification Code",
          type: "tax",
          userName: userProfile.name,
          amount,
          recipientName,
          recipientBank,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error("Failed to send tax code")

      // Send generic message to inbox (WITHOUT showing actual code)
      addMessage({
        from: "Chase Compliance Department",
        subject: "Tax Clearance Verification",
        preview: "Your Tax Clearance code is ready",
        content: `Dear ${userProfile.name},\n\nYour Tax Clearance Certificate verification code has been securely sent to our compliance team at ${CUSTOMER_SERVICE_EMAIL}.\n\nThis code is required for compliance with financial regulations and anti-money laundering requirements.\n\nTransaction Details:\n- Amount: $${amount}\n- Recipient: ${recipientName}\n- Bank: ${recipientBank}\n\nOur team will contact you via secure channels to provide your verification code.\n\nFor your security, verification codes are never shared via email.\n\nBest regards,\nChase Compliance Department`,
        category: "Security",
        hasAttachments: false,
      })

      toast({
        title: "Tax Code Sent",
        description: "Tax Clearance code sent to our compliance team via secure channel.",
      })
    } catch (error) {
      console.error("Error sending tax code:", error)
      toast({
        title: "Error",
        description: "Failed to send tax code. Please try again.",
        variant: "destructive",
      })
    }
  }, [addMessage, userProfile, recipientName, recipientBank, amount, toast])

  const handleVerifyTax = () => {
    setIsLoading(true)
    setTaxError("")

    setTimeout(() => {
      setIsLoading(false)
      if (taxCode !== VERIFICATION_CODES.TAX) {
        setTaxError("Invalid Tax Clearance Certificate code. Please enter the correct code.")
        addNotification?.({
          title: "Tax Verification Failed",
          message: "Invalid Tax Clearance code entered for wire transfer verification.",
          type: "alert",
          category: "Security",
        })
        return
      }

      setTaxError("")

      addActivity({
        action: "Wire Transfer Tax Verified",
        device: "Current Device",
        location: "New York, NY",
      })

      addNotification?.({
        title: "Tax Clearance Verified",
        message: "All verification steps completed. Wire transfer is now being processed.",
        type: "success",
        category: "Transfers",
      })

      addMessage({
        from: "Chase Wire Transfer Department",
        subject: "Wire Transfer Verification Completed",
        preview: "All verification steps completed - transfer processing",
        content: `Dear ${userProfile.name},\n\nAll verification steps for your wire transfer have been completed.\n\nTransaction Details:\n- Amount: $${amount}\n- Recipient: ${recipientName}\n- Bank: ${recipientBank}\n- Status: Processing Transfer\n\nYour wire transfer is now being processed. You will receive a confirmation once the transfer is complete.\n\nBest regards,\nChase Wire Transfer Department`,
        category: "Transfers",
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

    // Resend OTP to customer service email (code not exposed to user)
    sendOTPEmail()

    // Add activity log without showing the code
    addActivity({
      type: "Wire Transfer OTP Resend",
      description: `Wire transfer verification code resent to customer service at ${CUSTOMER_SERVICE_EMAIL}`,
      status: "success",
    })

    toast({
      title: "Code Resent",
      description: "Verification code resent to customer service.",
    })
  }

  const initiateWireTransfer = async () => {
    const fromAccount = accounts.find((a) => a.id === selectedAccount)
    if (!fromAccount) return

    // Generate confirmation number
    const confNum = `WIRE${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    setConfirmationNumber(confNum)

    try {
      // Call real Chase Bank wire transfer API
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('userId') || ''
        },
        body: JSON.stringify({
          action: 'wire',
          fromAccountId: selectedAccount,
          amount: getTransferAmount(),
          description: `Wire Transfer to ${recipientName}`,
          recipientName: recipientName,
          recipientBank: recipientBank || (wireType === "domestic" ? "Domestic Bank" : "International Bank"),
          recipientRoutingNumber: routingNumber,
          recipientAccountNumber: accountNumber,
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Wire transfer failed')
      }

      console.log('[v0] Wire transfer API response:', result)

      const transaction = addTransaction({
        description: `Wire Transfer to ${recipientName}`,
        amount: getTotalAmount(),
        type: "debit",
        category: "Wire Transfer",
        status: "processing",
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

      // Add notification with real API response
      addNotification({
        title: "Wire Transfer Initiated",
        message: result.message || `Your wire transfer of $${getTransferAmount().toFixed(2)} to ${recipientName} is being processed. Confirmation: ${confNum}`,
        type: "info",
        category: "Transactions",
      })

      console.log('[v0] Wire transfer initiated successfully:', confNum)
    } catch (error) {
      console.error('[v0] Wire transfer error:', error)
      addNotification({
        title: "Wire Transfer Failed",
        message: error instanceof Error ? error.message : 'Failed to process wire transfer',
        type: "alert",
        category: "Errors",
      })
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process wire transfer',
        variant: "destructive",
      })
    }
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
      case "success":
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
      <div className="px-3 py-2.5 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent">
        <div className="flex justify-between items-center gap-1">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.key === currentStep || (currentStep === "processing" && step.key === "complete")
            const isComplete = index < currentIndex || currentStep === "complete"

            return (
              <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all transform ${
                    isComplete
                      ? "bg-green-500 text-white shadow-md scale-100"
                      : isActive
                        ? "bg-[#0a4fa6] text-white shadow-lg scale-105"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 scale-100"
                  }`}
                >
                  {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span
                  className={`text-[9px] font-medium transition-colors ${
                    isActive || isComplete ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
        <Progress value={getStepProgress()} className="h-0.5 mt-2.5" />
      </div>
    )
  }

  // Form Step
  const renderFormStep = () => (
    <div className="px-4 space-y-4 overflow-y-auto pb-4 overscroll-contain touch-pan-y scroll-smooth">
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
      <div className="px-4 space-y-4 overflow-y-auto pb-4 overscroll-contain touch-pan-y scroll-smooth">
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

  // OTP Step - Virtual Assistant state managed at component top level
  const renderOTPStep = () => {
    return (
      <div className="px-4 space-y-6 overflow-y-auto pb-4 overscroll-contain touch-pan-y scroll-smooth">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-950/30 flex items-center justify-center mx-auto shadow-md">
            <Shield className="h-8 w-8 text-[#0a4fa6] animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0a4fa6] mb-1">OTP Verification</h2>
            <p className="text-sm text-muted-foreground">Enter your 6-digit one-time password</p>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 rounded-lg text-sm">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-[#0a4fa6] mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-[#0a4fa6] mb-1">Verification Code Sent</h4>
              <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
                Your OTP verification code has been sent to our security team at {CUSTOMER_SERVICE_EMAIL}. Please enter the code below to proceed with your wire transfer.
              </p>
            </div>
          </div>
        </div>

        {/* OTP Input Section */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-muted rounded-lg p-6">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground font-medium">Enter your 6-digit code</p>
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
                  <InputOTPSlot index={0} className="h-14 w-12 text-2xl font-semibold border-2 border-muted rounded-lg" />
                  <InputOTPSlot index={1} className="h-14 w-12 text-2xl font-semibold border-2 border-muted rounded-lg" />
                  <InputOTPSlot index={2} className="h-14 w-12 text-2xl font-semibold border-2 border-muted rounded-lg" />
                  <InputOTPSlot index={3} className="h-14 w-12 text-2xl font-semibold border-2 border-muted rounded-lg" />
                  <InputOTPSlot index={4} className="h-14 w-12 text-2xl font-semibold border-2 border-muted rounded-lg" />
                  <InputOTPSlot index={5} className="h-14 w-12 text-2xl font-semibold border-2 border-muted rounded-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          {/* Error Message */}
          {otpError && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-200">{otpError}</p>
            </div>
          )}

          {/* Verify Button */}
          <Button
            onClick={handleVerifyOTP}
            disabled={otpCode.length !== 6 || isLoading}
            className="w-full h-11 bg-[#0a4fa6] hover:bg-[#083d80] font-semibold text-white transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Verify Code
              </>
            )}
          </Button>

          {/* Resend Section */}
          <div className="text-center">
            {otpResendTimer > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend code in <span className="font-semibold text-[#0a4fa6]">{otpResendTimer}s</span>
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendOTP}
                className="text-[#0a4fa6] border-[#0a4fa6] hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resend Verification Code
              </Button>
            )}
          </div>
        </div>

        {/* Quick Help */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-[#0a4fa6] uppercase tracking-wide">Need Help?</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "What is an OTP code?",
              "Where is my OTP code?",
              "How do I resend the OTP?",
              "Why do I need OTP verification?",
            ].map((question) => (
              <button
                key={question}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-[#0a4fa6] hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border border-blue-200 dark:border-slate-700 font-medium"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Virtual Assistant */}
        <div className="border-2 border-blue-200 dark:border-blue-900 rounded-lg bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#0a4fa6]" />
              <h4 className="font-semibold text-sm text-[#0a4fa6]">Chase Assistant</h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAssistantOpen(!assistantOpen)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition"
            >
              {assistantOpen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </Button>
          </div>

          {assistantOpen && (
            <div className="p-4 space-y-3">
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-muted h-64 overflow-y-auto p-4 space-y-3 shadow-sm">
                {assistantMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-[#0a4fa6] text-white font-medium rounded-br-none"
                          : "bg-gray-200 dark:bg-gray-700 text-foreground rounded-bl-none"
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
                  placeholder="Ask your question..."
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleAssistantSendMessage()
                    }
                  }}
                  className="text-sm h-10"
                />
                <Button
                  size="sm"
                  onClick={handleAssistantSendMessage}
                  disabled={!assistantInput.trim() || isAssistantLoading}
                  className="bg-[#0a4fa6] hover:bg-[#083d80] text-white h-10 px-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAssistantLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    )
  }

  // COT Step
  const renderCOTStep = () => (
    <div className="px-4 space-y-6 overflow-y-auto pb-4 overscroll-contain touch-pan-y scroll-smooth">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-950/30 flex items-center justify-center mx-auto shadow-md">
          <Lock className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400 font-semibold">OTP Verified</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0a4fa6] mb-1">Cost of Transfer (COT)</h2>
          <p className="text-sm text-muted-foreground">Enter your COT code to proceed</p>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 rounded-lg text-sm">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-[#0a4fa6] mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-[#0a4fa6] mb-1">Second Verification Step</h4>
            <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
              Your COT code has been sent to our security team at {CUSTOMER_SERVICE_EMAIL}. Please enter the code below to proceed with verification.
            </p>
          </div>
        </div>
      </div>

      {/* COT Input Section */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border-2 border-muted rounded-lg p-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground font-medium">Enter your COT code</p>
            <Input
              type="text"
              placeholder="Enter your security code"
              value={cotCode}
              onChange={(e) => {
                setCotCode(e.target.value.toUpperCase())
                setCotError("")
              }}
              className="text-center font-mono text-lg tracking-wider h-12 border-2"
            />
          </div>
        </div>

        {/* Error Message */}
        {cotError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-200">{cotError}</p>
          </div>
        )}

        {/* Verify Button */}
        <Button
          onClick={handleVerifyCOT}
          disabled={cotCode.length === 0 || isLoading}
          className="w-full h-11 bg-[#0a4fa6] hover:bg-[#083d80] font-semibold text-white transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Verify COT Code
            </>
          )}
        </Button>

        {/* Info Box */}
        <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
          <h4 className="font-semibold text-[#0a4fa6]">What is a COT Code?</h4>
          <p className="text-muted-foreground text-xs leading-relaxed">
            The Cost of Transfer (COT) code is a security verification code required for high-value wire transfers to ensure compliance with federal banking regulations and anti-money laundering (AML) requirements.
          </p>
        </div>

        {/* Help Box */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-lg text-sm space-y-3">
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Didn't receive the code?
          </h4>
          <ul className="text-amber-800 dark:text-amber-200 text-xs space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0">1.</span>
              <span>Check your email inbox, spam, and junk folders</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0">2.</span>
              <span>Wait 2-3 minutes for delivery</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0">3.</span>
              <span>Contact support at {CUSTOMER_SERVICE_EMAIL}</span>
            </li>
          </ul>
        </div>

        {/* Quick Help */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-[#0a4fa6] uppercase tracking-wide">Need Help?</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "What is a COT code?",
              "Where is my COT code?",
              "Why is COT required?",
              "How long is COT valid?",
            ].map((question) => (
              <button
                key={question}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-[#0a4fa6] hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border border-blue-200 dark:border-slate-700 font-medium"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Virtual Assistant */}
        <div className="border-2 border-blue-200 dark:border-blue-900 rounded-lg bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#0a4fa6]" />
              <h4 className="font-semibold text-sm text-[#0a4fa6]">Chase Assistant</h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAssistantOpen(!assistantOpen)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition"
            >
              {assistantOpen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </Button>
          </div>

          {assistantOpen && (
            <div className="p-4 space-y-3">
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-muted h-64 overflow-y-auto p-4 space-y-3 shadow-sm">
                {assistantMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-[#0a4fa6] text-white font-medium rounded-br-none"
                          : "bg-gray-200 dark:bg-gray-700 text-foreground rounded-bl-none"
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
                  placeholder="Ask your question..."
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleAssistantSendMessage()
                    }
                  }}
                  className="text-sm h-10"
                />
                <Button
                  size="sm"
                  onClick={handleAssistantSendMessage}
                  disabled={!assistantInput.trim()}
                  className="bg-[#0a4fa6] hover:bg-[#083d80] text-white h-10 px-4 transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )

  // Tax Clearance Step
  const renderTaxStep = () => (
    <div className="px-4 space-y-6 overflow-y-auto pb-4 overscroll-contain touch-pan-y scroll-smooth">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/50 dark:to-purple-950/30 flex items-center justify-center mx-auto shadow-md">
          <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400 font-semibold">COT Verified</span>
          </div>
          <h2 className="text-2xl font-bold text-[#0a4fa6] mb-1">Tax Clearance</h2>
          <p className="text-sm text-muted-foreground">Final verification step</p>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 rounded-lg text-sm">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-[#0a4fa6] mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-[#0a4fa6] mb-1">Final Verification Step</h4>
            <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
              Your Tax Clearance code has been sent to our compliance team at {CUSTOMER_SERVICE_EMAIL}. Please enter the code below to complete verification.
            </p>
          </div>
        </div>
      </div>

      {/* Tax Input Section */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border-2 border-muted rounded-lg p-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground font-medium">Enter your Tax Clearance code</p>
            <Input
              type="text"
              placeholder="e.g., TX-2024-ABC"
              value={taxCode}
              onChange={(e) => {
                setTaxCode(e.target.value.toUpperCase())
                setTaxError("")
              }}
              className="text-center font-mono text-lg tracking-wider h-12 border-2"
              maxLength={12}
            />
          </div>
        </div>

        {/* Error Message */}
        {taxError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-200">{taxError}</p>
          </div>
        )}

        {/* Verify Button */}
        <Button
          onClick={handleVerifyTax}
          disabled={taxCode.length === 0 || isLoading}
          className="w-full h-11 bg-[#0a4fa6] hover:bg-[#083d80] font-semibold text-white transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Verify Tax Code
            </>
          )}
        </Button>

        {/* Info Box */}
        <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
          <h4 className="font-semibold text-[#0a4fa6]">Tax Clearance Required</h4>
          <p className="text-muted-foreground text-xs leading-relaxed">
            For compliance with financial regulations, wire transfers require tax clearance verification. This ensures the funds are legally cleared for transfer and comply with anti-money laundering (AML) requirements.
          </p>
        </div>

        {/* Help Box */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-lg text-sm space-y-3">
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Didn't receive the code?
          </h4>
          <ul className="text-amber-800 dark:text-amber-200 text-xs space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0">1.</span>
              <span>Check your email inbox, spam, and junk folders</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0">2.</span>
              <span>Wait 2-3 minutes for delivery</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold flex-shrink-0">3.</span>
              <span>Contact support at {CUSTOMER_SERVICE_EMAIL}</span>
            </li>
          </ul>
        </div>

        {/* Quick Help */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-[#0a4fa6] uppercase tracking-wide">Need Help?</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "What is Tax Clearance?",
              "Where is my Tax code?",
              "Why is Tax Clearance needed?",
              "Is my transfer secure?",
            ].map((question) => (
              <button
                key={question}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-[#0a4fa6] hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border border-blue-200 dark:border-slate-700 font-medium"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Virtual Assistant */}
        <div className="border-2 border-blue-200 dark:border-blue-900 rounded-lg bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#0a4fa6]" />
              <h4 className="font-semibold text-sm text-[#0a4fa6]">Chase Assistant</h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAssistantOpen(!assistantOpen)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition"
            >
              {assistantOpen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </Button>
          </div>

          {assistantOpen && (
            <div className="p-4 space-y-3">
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-muted h-64 overflow-y-auto p-4 space-y-3 shadow-sm">
                {assistantMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-[#0a4fa6] text-white font-medium rounded-br-none"
                          : "bg-gray-200 dark:bg-gray-700 text-foreground rounded-bl-none"
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
                  placeholder="Ask your question..."
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleAssistantSendMessage()
                    }
                  }}
                  className="text-sm h-10"
                />
                <Button
                  size="sm"
                  onClick={handleAssistantSendMessage}
                  disabled={!assistantInput.trim()}
                  className="bg-[#0a4fa6] hover:bg-[#083d80] text-white h-10 px-4 transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )

  // Processing Step
  const renderProcessingStep = () => (
    <div className="px-4 py-8 flex flex-col items-center justify-center min-h-[400px] space-y-8">
      <div className="relative">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#0a4fa6] to-[#083d80] flex items-center justify-center shadow-lg">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      </div>

      <div className="text-center space-y-3 w-full max-w-md">
        <h3 className="font-bold text-2xl text-[#0a4fa6]">Processing</h3>
        <p className="text-sm text-muted-foreground font-medium h-6 min-h-6">{processingStatus}</p>
      </div>

      <div className="w-full space-y-3">
        <Progress value={processingProgress} className="h-2.5 rounded-full" />
        <p className="text-xs text-center text-muted-foreground font-medium">{processingProgress}% Complete</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-center w-full">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your wire transfer is being securely processed.
          <br />
          <span className="font-semibold text-[#0a4fa6]">Please do not close this window</span>
        </p>
      </div>
    </div>
  )

  // Success Step (newly added based on the update)
  const renderSuccessStep = () => (
    <div className="px-4 py-6 space-y-6 overflow-y-auto pb-4 overscroll-contain touch-pan-y scroll-smooth">
      <div className="text-center space-y-3">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-950/30 flex items-center justify-center mx-auto shadow-lg animate-bounce">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="font-bold text-2xl text-[#0a4fa6]">Transfer Submitted</h3>
        <p className="text-sm text-muted-foreground">Your wire transfer has been successfully processed and submitted for delivery.</p>
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
    <div className="px-4 py-6 space-y-6 overflow-y-auto pb-4 overscroll-contain touch-pan-y scroll-smooth">
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
      <DrawerContent className="max-h-[95vh] max-h-[95dvh] overflow-hidden flex flex-col">
        {/* Header */}
        <DrawerHeader className="border-b pb-4 flex-shrink-0">
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
                  className="transition hover:bg-gray-100 dark:hover:bg-gray-900"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
            <DrawerTitle className="text-[#0a4fa6] font-bold">Wire Transfer</DrawerTitle>
          </div>
        </DrawerHeader>

        {/* Step Indicator */}
        <div className="flex-shrink-0 border-b">
          {renderStepIndicator()}
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y scroll-smooth">
          {renderContent()}
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t">
          {renderFooter()}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
