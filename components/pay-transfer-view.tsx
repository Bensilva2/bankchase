"use client"

import {
  Search,
  Smartphone,
  Banknote,
  Receipt,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Clock,
  Filter,
  Calendar,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBanking } from "@/lib/banking-context"
import { useState, useCallback, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PayTransferViewProps {
  onSendMoney: () => void
  onPayBills: () => void
  onTransfer: () => void
  onWire: () => void
  onReceiptOpen?: (transactionId: string) => void
}

export function PayTransferView({ onSendMoney, onPayBills, onTransfer, onWire, onReceiptOpen }: PayTransferViewProps) {
  const { transactions, scheduledPayments, cancelScheduledPayment } = useBanking()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAllTransactions, setShowAllTransactions] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showScheduledDetails, setShowScheduledDetails] = useState(false)
  
  // Payment option loading states - ensures smooth transitions
  const [loadingOption, setLoadingOption] = useState<string | null>(null)
  const [optionClickTimers, setOptionClickTimers] = useState<Record<string, NodeJS.Timeout>>({})

  // Handle smooth option loading with delay
  const handleOptionClick = useCallback((optionId: string, callback: () => void) => {
    setLoadingOption(optionId)
    
    // Clear any existing timer for this option
    if (optionClickTimers[optionId]) {
      clearTimeout(optionClickTimers[optionId])
    }

    // Simulate loading for smooth UX (like Chase app)
    const timer = setTimeout(() => {
      callback()
      setLoadingOption(null)
    }, 200)

    setOptionClickTimers((prev) => ({ ...prev, [optionId]: timer }))
  }, [optionClickTimers])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(optionClickTimers).forEach((timer) => clearTimeout(timer))
    }
  }, [optionClickTimers])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "scheduled":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "cancelled":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filterStatus === "all" || tx.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const displayedTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 8)

  const activeScheduledPayments = scheduledPayments?.filter((p) => p.status === "scheduled") || []

  return (
    <div className="space-y-6 pb-24 touch-pan-y overscroll-contain">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments & transfers"
            className="pl-11 bg-card border-0 chase-card-shadow h-12 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-9">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Actions Grid - with smooth loading states */}
      <div className="grid grid-cols-2 gap-3">
        {/* Send Money with Zelle */}
        <Card
          className="chase-card-shadow border-0 cursor-pointer hover:bg-muted/30 transition-all duration-150 active:scale-[0.97]"
          onClick={() => handleOptionClick("send-money", onSendMoney)}
        >
          <CardContent className="p-4">
            <div className="h-12 w-12 rounded-full bg-[#0a4fa6]/10 flex items-center justify-center mb-3">
              {loadingOption === "send-money" ? (
                <Loader2 className="h-6 w-6 text-[#0a4fa6] animate-spin" />
              ) : (
                <Smartphone className="h-6 w-6 text-[#0a4fa6]" />
              )}
            </div>
            <h3 className="font-semibold text-sm">Send money with Zelle®</h3>
            <p className="text-xs text-muted-foreground mt-1">Fast & free transfers</p>
          </CardContent>
        </Card>

        {/* Transfer Between Accounts */}
        <Card
          className="chase-card-shadow border-0 cursor-pointer hover:bg-muted/30 transition-all duration-150 active:scale-[0.97]"
          onClick={() => handleOptionClick("transfer", onTransfer)}
        >
          <CardContent className="p-4">
            <div className="h-12 w-12 rounded-full bg-[#0a4fa6]/10 flex items-center justify-center mb-3">
              {loadingOption === "transfer" ? (
                <Loader2 className="h-6 w-6 text-[#0a4fa6] animate-spin" />
              ) : (
                <RefreshCw className="h-6 w-6 text-[#0a4fa6]" />
              )}
            </div>
            <h3 className="font-semibold text-sm">Transfer</h3>
            <p className="text-xs text-muted-foreground mt-1">Between accounts</p>
          </CardContent>
        </Card>

        {/* Pay Bills */}
        <Card
          className="chase-card-shadow border-0 cursor-pointer hover:bg-muted/30 transition-all duration-150 active:scale-[0.97]"
          onClick={() => handleOptionClick("pay-bills", onPayBills)}
        >
          <CardContent className="p-4">
            <div className="h-12 w-12 rounded-full bg-[#0a4fa6]/10 flex items-center justify-center mb-3">
              {loadingOption === "pay-bills" ? (
                <Loader2 className="h-6 w-6 text-[#0a4fa6] animate-spin" />
              ) : (
                <Receipt className="h-6 w-6 text-[#0a4fa6]" />
              )}
            </div>
            <h3 className="font-semibold text-sm">Pay bills</h3>
            <p className="text-xs text-muted-foreground mt-1">Manage & schedule</p>
          </CardContent>
        </Card>

        {/* Wires & Global Transfers */}
        <Card
          className="chase-card-shadow border-0 cursor-pointer hover:bg-muted/30 transition-all duration-150 active:scale-[0.97]"
          onClick={() => handleOptionClick("wire", onWire)}
        >
          <CardContent className="p-4">
            <div className="h-12 w-12 rounded-full bg-[#0a4fa6]/10 flex items-center justify-center mb-3">
              {loadingOption === "wire" ? (
                <Loader2 className="h-6 w-6 text-[#0a4fa6] animate-spin" />
              ) : (
                <Banknote className="h-6 w-6 text-[#0a4fa6]" />
              )}
            </div>
            <h3 className="font-semibold text-sm">Wires & global</h3>
            <p className="text-xs text-muted-foreground mt-1">International transfers</p>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Payments */}
      {activeScheduledPayments.length > 0 && (
        <Card className="chase-card-shadow border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#0a4fa6]" />
                <h3 className="font-semibold text-[#0a4fa6]">Scheduled Payments</h3>
                <Badge variant="secondary" className="text-xs">
                  {activeScheduledPayments.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#0a4fa6] text-xs h-auto p-0"
                onClick={() => setShowScheduledDetails(!showScheduledDetails)}
              >
                {showScheduledDetails ? "Show less" : "Manage"}
              </Button>
            </div>
            <div className="space-y-3">
              {(showScheduledDetails ? activeScheduledPayments : activeScheduledPayments.slice(0, 3)).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{payment.payee}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusColor(payment.status)}`}>
                        {payment.frequency}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Next:{" "}
                        {new Date(payment.scheduledDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">${(payment.amount ?? 0).toFixed(2)}</span>
                    {showScheduledDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive h-7 px-2"
                        onClick={() => cancelScheduledPayment(payment.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="chase-card-shadow border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0a4fa6]">Recent Activity</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#0a4fa6] text-xs h-auto p-0 gap-1"
              onClick={() => setShowAllTransactions(!showAllTransactions)}
            >
              {showAllTransactions ? "Show less" : "See all"}
              <ChevronRight className={`h-3 w-3 transition-transform ${showAllTransactions ? "rotate-90" : ""}`} />
            </Button>
          </div>

          {searchQuery && (
            <p className="text-xs text-muted-foreground mb-3">
              {filteredTransactions.length} result{filteredTransactions.length !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
          )}

          <div className="space-y-3">
            {displayedTransactions.length > 0 ? (
              displayedTransactions.map((transaction) => (
                <button
                  key={transaction.id}
                  className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer text-left active:scale-[0.99]"
                  onClick={() => onReceiptOpen?.(transaction.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.type === "credit" ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                      }`}
                    >
                      {transaction.type === "credit" ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{transaction.description}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${getStatusColor(transaction.status)}`}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className={`font-semibold ${transaction.type === "credit" ? "text-green-600" : ""}`}>
                        {transaction.type === "debit" ? "-" : "+"}${(transaction.amount ?? 0).toFixed(2)}
                      </span>
                      {transaction.fee && transaction.fee > 0 && (
                        <p className="text-xs text-muted-foreground">Fee: ${(transaction.fee ?? 0).toFixed(2)}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{searchQuery ? "No matching transactions" : "No recent transactions"}</p>
              </div>
            )}
          </div>

          {showAllTransactions && filteredTransactions.length > 0 && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Showing all {filteredTransactions.length} transactions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
