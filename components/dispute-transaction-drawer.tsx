"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ShieldAlert,
  CreditCard,
  Package,
  RefreshCcw,
  HelpCircle,
  Upload,
  FileText,
} from "lucide-react"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"

interface DisputeTransactionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string | null
}

const disputeReasons = [
  {
    id: "unauthorized",
    label: "Unauthorized transaction",
    description: "I didn't make or authorize this transaction",
    icon: ShieldAlert,
  },
  {
    id: "not-received",
    label: "Product/Service not received",
    description: "I was charged but never received what I paid for",
    icon: Package,
  },
  {
    id: "duplicate",
    label: "Duplicate charge",
    description: "I was charged multiple times for the same item",
    icon: RefreshCcw,
  },
  {
    id: "wrong-amount",
    label: "Wrong amount charged",
    description: "The charge amount is different than expected",
    icon: CreditCard,
  },
  {
    id: "other",
    label: "Other reason",
    description: "My issue is not listed above",
    icon: HelpCircle,
  },
]

export function DisputeTransactionDrawer({ open, onOpenChange, transactionId }: DisputeTransactionDrawerProps) {
  const { getTransactionById, addNotification, userProfile } = useBanking()
  const { toast } = useToast()
  const transaction = transactionId ? getTransactionById(transactionId) : null

  const [step, setStep] = useState(1)
  const [selectedReason, setSelectedReason] = useState("")
  const [additionalDetails, setAdditionalDetails] = useState("")
  const [expectedAmount, setExpectedAmount] = useState("")
  const [contactedMerchant, setContactedMerchant] = useState(false)
  const [hasDocuments, setHasDocuments] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [disputeReference, setDisputeReference] = useState("")

  const resetForm = () => {
    setStep(1)
    setSelectedReason("")
    setAdditionalDetails("")
    setExpectedAmount("")
    setContactedMerchant(false)
    setHasDocuments(false)
    setIsSubmitting(false)
    setIsComplete(false)
    setDisputeReference("")
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(resetForm, 300)
  }

  const handleSubmit = () => {
    setIsSubmitting(true)

    // Generate dispute reference
    const reference = `DSP-${Date.now().toString(36).toUpperCase()}`

    setTimeout(() => {
      setDisputeReference(reference)
      setIsSubmitting(false)
      setIsComplete(true)

      // Add notification
      addNotification({
        title: "Dispute Submitted",
        message: `Your dispute for $${transaction?.amount.toFixed(2)} has been submitted. Reference: ${reference}`,
        type: "info",
        category: "Disputes",
      })

      toast({
        title: "Dispute Submitted",
        description: "We'll review your dispute within 10 business days.",
      })
    }, 2000)
  }

  if (!transaction) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4 border-b">
          <div className="flex items-center gap-3">
            {step > 1 && !isComplete && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <SheetTitle className="text-[#0a4fa6]">
                {isComplete ? "Dispute Submitted" : "Dispute Transaction"}
              </SheetTitle>
              {!isComplete && <p className="text-sm text-muted-foreground">Step {step} of 3</p>}
            </div>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Transaction Summary */}
          {!isComplete && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">{transaction.description}</p>
                  <p className="text-red-700 text-lg font-bold">-${transaction.amount.toFixed(2)}</p>
                  <p className="text-sm text-red-600">{formatDate(transaction.date)}</p>
                  {transaction.reference && (
                    <p className="text-xs text-red-500 font-mono mt-1">Ref: {transaction.reference}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Select Reason */}
          {step === 1 && !isComplete && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Why are you disputing this transaction?</h3>
                <p className="text-sm text-muted-foreground">Select the reason that best describes your issue</p>
              </div>

              <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-3">
                {disputeReasons.map((reason) => (
                  <div
                    key={reason.id}
                    className={`flex items-start space-x-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                      selectedReason === reason.id
                        ? "border-[#0a4fa6] bg-blue-50"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setSelectedReason(reason.id)}
                  >
                    <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <reason.icon className="h-4 w-4 text-[#0a4fa6]" />
                        <Label htmlFor={reason.id} className="font-medium cursor-pointer">
                          {reason.label}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{reason.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              <Button
                className="w-full bg-[#0a4fa6] hover:bg-[#083d82] h-12 rounded-xl"
                disabled={!selectedReason}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Additional Details */}
          {step === 2 && !isComplete && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold mb-1">Tell us more about this dispute</h3>
                <p className="text-sm text-muted-foreground">Provide additional details to help us investigate</p>
              </div>

              {selectedReason === "wrong-amount" && (
                <div className="space-y-2">
                  <Label htmlFor="expectedAmount">What amount did you expect to be charged?</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="expectedAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={expectedAmount}
                      onChange={(e) => setExpectedAmount(e.target.value)}
                      className="pl-7 h-12 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="details">Describe what happened</Label>
                <Textarea
                  id="details"
                  placeholder="Please provide as much detail as possible about this transaction and why you're disputing it..."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  className="min-h-[120px] rounded-xl resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <Checkbox
                    id="contactedMerchant"
                    checked={contactedMerchant}
                    onCheckedChange={(checked) => setContactedMerchant(checked as boolean)}
                  />
                  <div>
                    <Label htmlFor="contactedMerchant" className="font-medium cursor-pointer">
                      I have contacted the merchant
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      We recommend trying to resolve the issue with the merchant first
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <Checkbox
                    id="hasDocuments"
                    checked={hasDocuments}
                    onCheckedChange={(checked) => setHasDocuments(checked as boolean)}
                  />
                  <div>
                    <Label htmlFor="hasDocuments" className="font-medium cursor-pointer">
                      I have supporting documents
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receipts, emails, or other proof to support your dispute
                    </p>
                  </div>
                </div>
              </div>

              {hasDocuments && (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Upload supporting documents</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
                  <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                    Choose Files
                  </Button>
                </div>
              )}

              <Button
                className="w-full bg-[#0a4fa6] hover:bg-[#083d82] h-12 rounded-xl"
                disabled={!additionalDetails.trim()}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && !isComplete && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold mb-1">Review your dispute</h3>
                <p className="text-sm text-muted-foreground">
                  Please confirm the details are correct before submitting
                </p>
              </div>

              <div className="space-y-4 bg-muted/50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Dispute Reason</p>
                  <p className="font-medium">{disputeReasons.find((r) => r.id === selectedReason)?.label}</p>
                </div>

                {selectedReason === "wrong-amount" && expectedAmount && (
                  <div>
                    <p className="text-xs text-muted-foreground">Expected Amount</p>
                    <p className="font-medium">${Number.parseFloat(expectedAmount).toFixed(2)}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground">Your Description</p>
                  <p className="font-medium text-sm">{additionalDetails}</p>
                </div>

                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Contacted Merchant</p>
                    <p className="font-medium">{contactedMerchant ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Documents Attached</p>
                    <p className="font-medium">{hasDocuments ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">Important Information</p>
                    <ul className="text-amber-800 mt-1 space-y-1 text-xs">
                      <li>• We'll investigate your dispute within 10 business days</li>
                      <li>• You may receive a provisional credit while we investigate</li>
                      <li>• We may contact you for additional information</li>
                      <li>• Filing a false dispute is a violation of our terms</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700 h-12 rounded-xl"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting Dispute...
                  </div>
                ) : (
                  "Submit Dispute"
                )}
              </Button>
            </div>
          )}

          {/* Success State */}
          {isComplete && (
            <div className="text-center space-y-6 py-8">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="h-10 w-10 text-green-600" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-green-700">Dispute Submitted Successfully</h3>
                <p className="text-muted-foreground mt-2">
                  We've received your dispute and will begin our investigation.
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-left space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Reference Number</p>
                  <p className="font-mono font-bold text-[#0a4fa6]">{disputeReference}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transaction</p>
                  <p className="font-medium">{transaction.description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount Disputed</p>
                  <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expected Resolution</p>
                  <p className="font-medium">Within 10 business days</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  What happens next?
                </h4>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• We'll review your dispute and contact the merchant</li>
                  <li>• You'll receive email updates at {userProfile?.email}</li>
                  <li>• Check your notifications for status updates</li>
                  <li>• Contact us if you have additional information</li>
                </ul>
              </div>

              <Button className="w-full bg-[#0a4fa6] hover:bg-[#083d82] h-12 rounded-xl" onClick={handleClose}>
                Done
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
