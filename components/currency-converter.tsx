"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeftRight, RefreshCw, TrendingUp, TrendingDown, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
}

interface CurrencyConverterProps {
  onConvert?: (from: string, to: string, amount: number, converted: number) => void
  defaultFrom?: string
  defaultTo?: string
  showFees?: boolean
}

const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "US" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "EU" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "GB" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "JP" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "CA" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "MX" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "IN" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "CN" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "AU" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "CH" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "BR" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "PH" },
]

// Simulated exchange rates (in production, fetch from API)
const RATES: Record<string, number> = {
  "USD-EUR": 0.92,
  "USD-GBP": 0.79,
  "USD-JPY": 149.5,
  "USD-CAD": 1.36,
  "USD-MXN": 17.15,
  "USD-INR": 83.12,
  "USD-CNY": 7.24,
  "USD-AUD": 1.53,
  "USD-CHF": 0.88,
  "USD-BRL": 4.97,
  "USD-PHP": 56.15,
  "EUR-USD": 1.09,
  "EUR-GBP": 0.86,
  "GBP-USD": 1.27,
  "GBP-EUR": 1.16,
}

function getRate(from: string, to: string): number {
  if (from === to) return 1
  const direct = RATES[`${from}-${to}`]
  if (direct) return direct
  const inverse = RATES[`${to}-${from}`]
  if (inverse) return 1 / inverse
  // Convert through USD
  const fromToUsd = from === "USD" ? 1 : 1 / (RATES[`USD-${from}`] || 1)
  const usdToTo = to === "USD" ? 1 : RATES[`USD-${to}`] || 1
  return fromToUsd * usdToTo
}

export function CurrencyConverter({
  onConvert,
  defaultFrom = "USD",
  defaultTo = "EUR",
  showFees = true,
}: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState(defaultFrom)
  const [toCurrency, setToCurrency] = useState(defaultTo)
  const [amount, setAmount] = useState("1000")
  const [convertedAmount, setConvertedAmount] = useState(0)
  const [rate, setRate] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [rateChange, setRateChange] = useState<"up" | "down" | "none">("none")

  const calculateConversion = useCallback(() => {
    const numAmount = parseFloat(amount) || 0
    const currentRate = getRate(fromCurrency, toCurrency)
    const converted = numAmount * currentRate
    
    setRate(currentRate)
    setConvertedAmount(converted)
    setLastUpdated(new Date())
    
    // Simulate rate change indicator
    setRateChange(Math.random() > 0.5 ? "up" : "down")
    
    onConvert?.(fromCurrency, toCurrency, numAmount, converted)
  }, [amount, fromCurrency, toCurrency, onConvert])

  useEffect(() => {
    calculateConversion()
  }, [calculateConversion])

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    calculateConversion()
    setIsLoading(false)
  }

  const fromCurrencyData = CURRENCIES.find((c) => c.code === fromCurrency)
  const toCurrencyData = CURRENCIES.find((c) => c.code === toCurrency)

  // Calculate fees
  const feePercentage = parseFloat(amount) >= 10000 ? 0 : 0.1
  const feeAmount = (parseFloat(amount) || 0) * (feePercentage / 100)
  const totalDebit = (parseFloat(amount) || 0) + feeAmount

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Currency Converter</CardTitle>
            <CardDescription>Real-time exchange rates</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">You send</label>
          <div className="flex gap-2">
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{currency.flag}</span>
                      <span>{currency.code}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 text-right text-lg font-medium"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Swap Button and Rate Display */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">1 {fromCurrency} =</span>
            <span className="font-medium">{rate.toFixed(4)} {toCurrency}</span>
            {rateChange === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
            {rateChange === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
          </div>
          <Button variant="outline" size="icon" onClick={handleSwapCurrencies}>
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Recipient gets</label>
          <div className="flex gap-2">
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{currency.flag}</span>
                      <span>{currency.code}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 flex items-center justify-end px-3 bg-muted rounded-md">
              <span className="text-lg font-bold text-primary">
                {toCurrencyData?.symbol}
                {convertedAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Fees Breakdown */}
        {showFees && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transfer amount</span>
              <span>
                {fromCurrencyData?.symbol}
                {parseFloat(amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                FX Fee ({feePercentage}%)
                {feePercentage === 0 && (
                  <Badge variant="outline" className="ml-2 text-xs">Waived</Badge>
                )}
              </span>
              <span>
                {fromCurrencyData?.symbol}
                {feeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total debit</span>
              <span>
                {fromCurrencyData?.symbol}
                {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-2">
          <Clock className="h-3 w-3" />
          <span>Rate updated {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
