"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Camera,
  X,
  Check,
  RotateCcw,
  Flashlight,
  Info,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ImageIcon,
  ZoomIn,
  HelpCircle,
  DollarSign,
  Building2,
  FileText,
  Clock,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useBanking } from "@/lib/banking-context"
import { ToastAction } from "@/components/ui/toast"

interface DepositChecksDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReceiptOpen?: (transactionId: string) => void
}

type DepositStep =
  | "select-account"
  | "enter-amount"
  | "capture-front"
  | "capture-back"
  | "review"
  | "processing"
  | "success"

export function DepositChecksDrawer({ open, onOpenChange, onReceiptOpen }: DepositChecksDrawerProps) {
  const [step, setStep] = useState<DepositStep>("select-account")
  const [amount, setAmount] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [depositedTransaction, setDepositedTransaction] = useState<string | null>(null)
  const [showTips, setShowTips] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { toast } = useToast()
  const { accounts, addTransaction, updateBalance, addNotification, addActivity } = useBanking()

  const checkingAccounts = accounts.filter(
    (a) =>
      a.type?.toLowerCase() === "checking" ||
      a.type?.toLowerCase() === "savings" ||
      a.type === "Checking" ||
      a.type === "Savings",
  )

  const resetState = useCallback(() => {
    setStep("select-account")
    setAmount("")
    setSelectedAccount(null)
    setFrontImage(null)
    setBackImage(null)
    setIsCapturing(false)
    setProcessingProgress(0)
    setDepositedTransaction(null)
    setShowTips(false)
    setImagePreview(null)
    stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsCapturing(true)
    } catch (error) {
      console.log("[v0] Camera access denied, using file upload fallback")
      // Fallback to file upload
      fileInputRef.current?.click()
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    setIsCapturing(false)
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL("image/jpeg", 0.9)

        if (step === "capture-front") {
          setFrontImage(imageData)
          stopCamera()
          setStep("capture-back")
        } else if (step === "capture-back") {
          setBackImage(imageData)
          stopCamera()
          setStep("review")
        }
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        if (side === "front") {
          setFrontImage(imageData)
          setStep("capture-back")
        } else {
          setBackImage(imageData)
          setStep("review")
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const retakeImage = (side: "front" | "back") => {
    if (side === "front") {
      setFrontImage(null)
      setStep("capture-front")
    } else {
      setBackImage(null)
      setStep("capture-back")
    }
  }

  const processDeposit = async () => {
    setStep("processing")

    const steps = [
      { progress: 20, message: "Verifying check image quality..." },
      { progress: 40, message: "Reading check information..." },
      { progress: 60, message: "Verifying account details..." },
      { progress: 80, message: "Processing deposit..." },
      { progress: 100, message: "Finalizing..." },
    ]

    for (const stepInfo of steps) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setProcessingProgress(stepInfo.progress)
    }

    const depositAmount = Number.parseFloat(amount)

    if (selectedAccount) {
      updateBalance(selectedAccount, depositAmount)
    }

    const transaction = addTransaction({
      description: "Mobile Check Deposit",
      amount: depositAmount,
      type: "credit",
      category: "Deposit",
      status: "pending",
      reference: `CHK${Date.now()}`,
      accountId: selectedAccount || undefined,
      accountTo: accounts.find((a) => a.id === selectedAccount)?.name,
    })

    setDepositedTransaction(transaction.id)

    addNotification({
      title: "Check Deposited",
      message: `$${depositAmount.toFixed(2)} deposited via mobile check. Funds available in 1-2 business days.`,
      type: "success",
      category: "Transactions",
    })

    addActivity({
      action: `Deposited check for $${depositAmount.toFixed(2)}`,
      device: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser",
      location: "Current Session",
    })

    setStep("success")

    toast({
      title: "Check Deposited Successfully",
      description: `$${depositAmount.toFixed(2)} deposited. Funds available in 1-2 business days.`,
      action: onReceiptOpen ? (
        <ToastAction altText="View Receipt" onClick={() => onReceiptOpen(transaction.id)}>
          Receipt
        </ToastAction>
      ) : undefined,
    })
  }

  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  const depositLimits = {
    daily: 10000,
    perCheck: 5000,
    monthly: 50000,
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetState()
        }
        onOpenChange(isOpen)
      }}
    >
      <DrawerContent className="max-h-[95vh]">
        {/* Header */}
        <DrawerHeader className="border-b bg-[#0a4fa6] text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-white flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Deposit Checks
            </DrawerTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
          </div>
          {/* Progress indicator */}
          {step !== "success" && step !== "processing" && (
            <div className="flex items-center gap-2 mt-3">
              {["select-account", "enter-amount", "capture-front", "capture-back", "review"].map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    ["select-account", "enter-amount", "capture-front", "capture-back", "review"].indexOf(step) >= i
                      ? "bg-white"
                      : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </DrawerHeader>

        <div className="overflow-y-auto max-h-[70vh]">
          {/* Step 1: Select Account */}
          {step === "select-account" && (
            <div className="p-4 space-y-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">Select Deposit Account</h3>
                <p className="text-sm text-muted-foreground">Choose which account to deposit your check into</p>
              </div>

              <div className="space-y-3">
                {checkingAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedAccount(account.id)
                      setStep("enter-amount")
                    }}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedAccount === account.id
                        ? "border-[#0a4fa6] bg-blue-50"
                        : "border-gray-200 hover:border-[#0a4fa6]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0a4fa6] rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">...{account.accountNumber.slice(-4)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(account.balance || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Deposit Limits Info */}
              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-[#0a4fa6] mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-[#0a4fa6]">Deposit Limits</p>
                    <p className="text-gray-600 mt-1">Daily: ${depositLimits.daily.toLocaleString()}</p>
                    <p className="text-gray-600">Per Check: ${depositLimits.perCheck.toLocaleString()}</p>
                    <p className="text-gray-600">Monthly: ${depositLimits.monthly.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Enter Amount */}
          {step === "enter-amount" && (
            <div className="p-4 space-y-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">Enter Check Amount</h3>
                <p className="text-sm text-muted-foreground">Enter the exact amount written on your check</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <Label htmlFor="check-amount" className="text-sm text-muted-foreground">
                  Check Amount
                </Label>
                <div className="relative mt-2">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <Input
                    id="check-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={depositLimits.perCheck}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 text-3xl h-16 font-semibold text-center"
                  />
                </div>
                {Number.parseFloat(amount) > depositLimits.perCheck && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Exceeds per-check limit of ${depositLimits.perCheck.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="text-[#0a4fa6]"
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep("select-account")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep("capture-front")}
                  className="flex-1 bg-[#0a4fa6]"
                  disabled={
                    !amount || Number.parseFloat(amount) <= 0 || Number.parseFloat(amount) > depositLimits.perCheck
                  }
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Capture Front */}
          {step === "capture-front" && (
            <div className="p-4 space-y-4">
              <div className="text-center mb-2">
                <h3 className="font-semibold text-lg">Capture Front of Check</h3>
                <p className="text-sm text-muted-foreground">Position the front of your check within the frame</p>
              </div>

              {isCapturing ? (
                <div className="relative bg-black rounded-lg overflow-hidden aspect-[16/9]">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
                  {/* Overlay frame guide */}
                  <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Camera controls */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setFlashOn(!flashOn)}
                      className="bg-black/50 border-white/50 text-white hover:bg-black/70"
                    >
                      <Flashlight className={`h-5 w-5 ${flashOn ? "text-yellow-400" : ""}`} />
                    </Button>
                    <Button
                      size="lg"
                      onClick={captureImage}
                      className="bg-white text-black hover:bg-gray-200 rounded-full w-16 h-16"
                    >
                      <Camera className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={stopCamera}
                      className="bg-black/50 border-white/50 text-white hover:bg-black/70"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : frontImage ? (
                <div className="relative aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={frontImage || "/placeholder.svg"}
                    alt="Front of check"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Captured
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retakeImage("front")}
                    className="absolute bottom-2 right-2"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Retake
                  </Button>
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                  <div className="w-24 h-16 border-2 border-gray-400 rounded mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Front of Check</p>
                  <div className="flex gap-2">
                    <Button onClick={startCamera} className="bg-[#0a4fa6]">
                      <Camera className="h-4 w-4 mr-2" />
                      Use Camera
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "front")}
                  />
                </div>
              )}

              {/* Tips */}
              <button
                onClick={() => setShowTips(!showTips)}
                className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg text-sm"
              >
                <span className="flex items-center gap-2 text-[#0a4fa6]">
                  <HelpCircle className="h-4 w-4" />
                  Tips for capturing your check
                </span>
                <ChevronRight
                  className={`h-4 w-4 text-[#0a4fa6] transition-transform ${showTips ? "rotate-90" : ""}`}
                />
              </button>

              {showTips && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    Place check on a dark, flat surface
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    Ensure all four corners are visible
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    Avoid shadows and glare
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    Make sure the image is in focus
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep("enter-amount")} className="flex-1">
                  Back
                </Button>
                {frontImage && (
                  <Button onClick={() => setStep("capture-back")} className="flex-1 bg-[#0a4fa6]">
                    Continue
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Capture Back */}
          {step === "capture-back" && (
            <div className="p-4 space-y-4">
              <div className="text-center mb-2">
                <h3 className="font-semibold text-lg">Capture Back of Check</h3>
                <p className="text-sm text-muted-foreground">Sign and write "For Mobile Deposit Only" then capture</p>
              </div>

              {/* Endorsement reminder */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Don't forget to endorse!</p>
                  <p className="text-amber-700">Sign the back and write "For Mobile Deposit Only to Chase"</p>
                </div>
              </div>

              {isCapturing ? (
                <div className="relative bg-black rounded-lg overflow-hidden aspect-[16/9]">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
                  <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setFlashOn(!flashOn)}
                      className="bg-black/50 border-white/50 text-white hover:bg-black/70"
                    >
                      <Flashlight className={`h-5 w-5 ${flashOn ? "text-yellow-400" : ""}`} />
                    </Button>
                    <Button
                      size="lg"
                      onClick={captureImage}
                      className="bg-white text-black hover:bg-gray-200 rounded-full w-16 h-16"
                    >
                      <Camera className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={stopCamera}
                      className="bg-black/50 border-white/50 text-white hover:bg-black/70"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : backImage ? (
                <div className="relative aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={backImage || "/placeholder.svg"}
                    alt="Back of check"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Captured
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retakeImage("back")}
                    className="absolute bottom-2 right-2"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Retake
                  </Button>
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                  <div className="w-24 h-16 border-2 border-gray-400 rounded mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Back of Check</p>
                  <div className="flex gap-2">
                    <Button onClick={startCamera} className="bg-[#0a4fa6]">
                      <Camera className="h-4 w-4 mr-2" />
                      Use Camera
                    </Button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "back")}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep("capture-front")} className="flex-1">
                  Back
                </Button>
                {backImage && (
                  <Button onClick={() => setStep("review")} className="flex-1 bg-[#0a4fa6]">
                    Continue
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === "review" && (
            <div className="p-4 space-y-4">
              <div className="text-center mb-2">
                <h3 className="font-semibold text-lg">Review Your Deposit</h3>
                <p className="text-sm text-muted-foreground">Please confirm all details are correct</p>
              </div>

              {/* Deposit Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">Deposit Amount</span>
                  <span className="text-2xl font-bold text-[#0a4fa6]">${Number.parseFloat(amount).toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Deposit To</span>
                  <span className="font-medium">
                    {accounts.find((a) => a.id === selectedAccount)?.name || "Checking"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Account Number</span>
                  <span className="font-medium">
                    ...{accounts.find((a) => a.id === selectedAccount)?.accountNumber.slice(-4) || "0000"}
                  </span>
                </div>
              </div>

              {/* Check Images Preview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Front</p>
                  <div
                    className="aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden cursor-pointer relative group"
                    onClick={() => setImagePreview(frontImage)}
                  >
                    {frontImage && (
                      <>
                        <img
                          src={frontImage || "/placeholder.svg"}
                          alt="Front of check"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => retakeImage("front")}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Retake
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">Back</p>
                  <div
                    className="aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden cursor-pointer relative group"
                    onClick={() => setImagePreview(backImage)}
                  >
                    {backImage && (
                      <>
                        <img
                          src={backImage || "/placeholder.svg"}
                          alt="Back of check"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => retakeImage("back")}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Retake
                  </Button>
                </div>
              </div>

              {/* Funds Availability */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[#0a4fa6] mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-[#0a4fa6]">Funds Availability</p>
                    <p className="text-gray-600 mt-1">
                      ${(Number.parseFloat(amount) * 0.225).toFixed(2)} available immediately
                    </p>
                    <p className="text-gray-600">
                      ${(Number.parseFloat(amount) * 0.775).toFixed(2)} available in 1-2 business days
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep("capture-back")} className="flex-1">
                  Back
                </Button>
                <Button onClick={processDeposit} className="flex-1 bg-[#0a4fa6]">
                  Deposit Check
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Processing */}
          {step === "processing" && (
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                <div
                  className="absolute inset-0 border-4 border-[#0a4fa6] rounded-full transition-all duration-500"
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(processingProgress * 0.0628)}% ${50 - 50 * Math.cos(processingProgress * 0.0628)}%, 50% 50%)`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-[#0a4fa6] animate-spin" />
                </div>
              </div>
              <p className="text-lg font-medium mb-2">Processing Your Deposit</p>
              <p className="text-sm text-muted-foreground mb-4">Please wait while we verify your check...</p>
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#0a4fa6] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{processingProgress}% complete</p>
            </div>
          )}

          {/* Step 7: Success */}
          {step === "success" && (
            <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">Deposit Successful!</h3>
              <p className="text-3xl font-bold mb-2">${Number.parseFloat(amount).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Your check has been deposited to your{" "}
                {accounts.find((a) => a.id === selectedAccount)?.name || "Checking"} account
              </p>

              <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confirmation #</span>
                  <span className="font-mono">{depositedTransaction}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-amber-600 font-medium">Pending Verification</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                {depositedTransaction && onReceiptOpen && (
                  <Button variant="outline" onClick={() => onReceiptOpen(depositedTransaction)} className="flex-1">
                    View Receipt
                  </Button>
                )}
                <Button onClick={handleClose} className="flex-1 bg-[#0a4fa6]">
                  Done
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  resetState()
                  setStep("select-account")
                }}
                className="mt-4 text-[#0a4fa6]"
              >
                Deposit Another Check
              </Button>
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        {imagePreview && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setImagePreview(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setImagePreview(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="Check preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
