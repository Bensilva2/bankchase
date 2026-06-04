"use client"

import { useState, useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import axios from "axios"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, TrendingUp } from "lucide-react"
import { toast } from "sonner"

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
]

const transferSchema = z.object({
  sourceCurrency: z.string().min(3).max(3),
  targetCurrency: z.string().min(3).max(3),
  sourceAmount: z.string().transform((val) => parseFloat(val)).pipe(z.number().positive()),
  recipientName: z.string().min(1, "Recipient name is required"),
  recipientAccountNumber: z.string().min(1, "Account number is required"),
  recipientBank: z.string().min(1, "Bank name is required"),
})

type TransferFormData = z.infer<typeof transferSchema>

interface WiseTransferFormProps {
  userId: string
  profileId: number
  onSuccess?: (transfer: any) => void
}

interface Quote {
  id: string
  sourceCurrency: string
  targetCurrency: string
  sourceAmount: number
  targetAmount: number
  exchangeRate: number
  fee: number
  validUntil: string
}

export function WiseTransferForm({ userId, profileId, onSuccess }: WiseTransferFormProps) {
  const [sourceAmount, setSourceAmount] = useState("")
  const [targetCurrency, setTargetCurrency] = useState("EUR")
  const [sourceCurrency, setSourceCurrency] = useState("USD")
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceCurrency: "USD",
      targetCurrency: "EUR",
    },
  })

  // Fetch quote when amounts or currencies change
  const fetchQuote = useCallback(
    async (amount: number, fromCurrency: string, toCurrency: string) => {
      if (amount <= 0) return

      setIsLoadingQuote(true)
      setQuoteError(null)

      try {
        const response = await axios.post("/api/wise/quotes", {
          profileId,
          sourceCurrency: fromCurrency,
          targetCurrency: toCurrency,
          sourceAmount: amount,
        })

        setQuote({
          id: response.data.id,
          sourceCurrency: response.data.sourceCurrency,
          targetCurrency: response.data.targetCurrency,
          sourceAmount: response.data.sourceAmount,
          targetAmount: response.data.targetAmount,
          exchangeRate: response.data.rate,
          fee: response.data.fee?.total || 0,
          validUntil: response.data.validUntil,
        })
      } catch (error) {
        const errorMessage = axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to fetch quote"
          : "Failed to fetch quote"
        setQuoteError(errorMessage)
        setQuote(null)
        console.error("Quote fetch error:", error)
      } finally {
        setIsLoadingQuote(false)
      }
    },
    [profileId]
  )

  // Debounced quote fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceAmount && parseFloat(sourceAmount) > 0) {
        fetchQuote(parseFloat(sourceAmount), sourceCurrency, targetCurrency)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [sourceAmount, sourceCurrency, targetCurrency, fetchQuote])

  const onSubmit = async (data: TransferFormData) => {
    if (!quote) {
      toast.error("Please wait for quote to load")
      return
    }

    setIsSubmitting(true)

    try {
      // Create transfer
      const transferResponse = await axios.post("/api/wise/transfers", {
        profileId,
        userId,
        quoteUuid: quote.id,
        targetAccountId: 1, // This should come from recipient selection
        sourceCurrency: data.sourceCurrency,
        targetCurrency: data.targetCurrency,
        sourceAmount: data.sourceAmount,
        targetAmount: quote.targetAmount,
        exchangeRate: quote.exchangeRate,
        feeAmount: quote.fee,
        recipientAccountId: "1",
        recipientName: data.recipientName,
        recipientAccountNumber: data.recipientAccountNumber,
        recipientBank: data.recipientBank,
      })

      const transfer = transferResponse.data

      // Fund the transfer
      await axios.post(`/api/wise/transfers/${transfer.wiseId}/fund`, {
        type: "BALANCE",
      })

      toast.success("Transfer initiated successfully!")
      onSuccess?.(transfer)

      // Reset form
      setSourceAmount("")
      setQuote(null)
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Transfer failed"
        : "Transfer failed"
      toast.error(errorMessage)
      console.error("Transfer error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>International Money Transfer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Currency Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Currency</Label>
              <Select value={sourceCurrency} onValueChange={setSourceCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To Currency</Label>
              <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label>Amount to Send</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={sourceAmount}
              onChange={(e) => setSourceAmount(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          {/* Quote Display */}
          {isLoadingQuote && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching live quote...
            </div>
          )}

          {quoteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{quoteError}</AlertDescription>
            </Alert>
          )}

          {quote && (
            <div className="space-y-3 rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">You&apos;ll send</p>
                  <p className="text-2xl font-bold">
                    {quote.sourceCurrency} {quote.sourceAmount.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>

              <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span className="font-medium">1 {sourceCurrency} = {quote.exchangeRate.toFixed(4)} {targetCurrency}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-medium">{sourceCurrency} {quote.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-blue-200 dark:border-blue-800">
                  <span>Recipient gets</span>
                  <span className="text-lg">{quote.targetCurrency} {quote.targetAmount.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Quote valid until {new Date(quote.validUntil).toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Recipient Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Recipient Information</h3>

            <div className="space-y-2">
              <Label>Recipient Name</Label>
              <Input {...register("recipientName")} placeholder="Full name" />
              {errors.recipientName && (
                <p className="text-sm text-red-500">{errors.recipientName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Account Number / IBAN</Label>
              <Input {...register("recipientAccountNumber")} placeholder="Account number or IBAN" />
              {errors.recipientAccountNumber && (
                <p className="text-sm text-red-500">{errors.recipientAccountNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input {...register("recipientBank")} placeholder="Bank name" />
              {errors.recipientBank && (
                <p className="text-sm text-red-500">{errors.recipientBank.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !quote || isLoadingQuote}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Send Money"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
