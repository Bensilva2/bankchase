"use client"

import { ChevronRight, Eye, EyeOff, TrendingUp, TrendingDown, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useBanking } from "@/lib/banking-context"
import { useState } from "react"

interface AccountsSectionProps {
  onViewAccount: () => void
  onLinkExternal: () => void
  onSeeAllTransactions: () => void
  onReceiptOpen: (transactionId: string) => void
}

export function AccountsSection({
  onViewAccount,
  onLinkExternal,
  onSeeAllTransactions,
  onReceiptOpen,
}: AccountsSectionProps) {
  const { accounts, transactions } = useBanking()
  const [showBalances, setShowBalances] = useState(true)
  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0)

  // Get recent transactions for display (sorted by date)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const pendingCount = transactions.filter((tx) => tx.status === "pending").length

  const formatBalance = (balance?: number) => {
    if (!showBalances) return "••••••"
    const safeBalance = balance ?? 0
    return safeBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      case "failed":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-[#0a4fa6]">Accounts</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#0a4fa6] gap-1"
          onClick={() => setShowBalances(!showBalances)}
        >
          {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showBalances ? "Hide" : "Show"}
        </Button>
      </div>

      <Card className="chase-card-shadow border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-[#0a4fa6] to-[#117aca] px-4 py-3">
          <p className="text-white/80 text-sm">Total Balance</p>
          <p className="text-white text-3xl font-bold">${formatBalance(totalBalance)}</p>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-yellow-300" />
              <span className="text-yellow-200 text-xs">
                {pendingCount} pending transaction{pendingCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </Card>

      <Card className="chase-card-shadow border-0 overflow-hidden">
        <div className="bg-[#0a4fa6] px-4 py-2">
          <h3 className="text-white font-medium text-sm">Bank Accounts ({accounts.length})</h3>
        </div>
        <CardContent className="p-0 divide-y divide-border">
          {accounts.map((account) => (
            <button
              key={account.id}
              className="w-full text-left p-4 hover:bg-muted/50 transition-all duration-150 active:bg-muted/70 active:scale-[0.99]"
              onClick={onViewAccount}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {account.name}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {account.id === "1" ? account.accountNumber : `...${account.accountNumber}`}
                </span>
                <div className="text-right">
                  <span className="text-xl font-bold">
                    ${formatBalance(account.availableBalance ?? account.balance)}
                  </span>
                  <p className="text-xs text-muted-foreground">Available balance</p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="chase-card-shadow border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0a4fa6]">Recent Transactions</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#0a4fa6] text-xs h-auto p-0 hover:underline"
              onClick={onSeeAllTransactions}
            >
              See All
            </Button>
          </div>
          <div className="space-y-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <button
                  key={tx.id}
                  className="w-full flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/50 rounded-lg px-2 transition-all duration-150 text-left active:bg-muted/70 active:scale-[0.99]"
                  onClick={() => onReceiptOpen(tx.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center ${
                        tx.type === "credit" ? "bg-green-100" : "bg-red-50"
                      }`}
                    >
                      {tx.type === "credit" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[180px]">{tx.description}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{getRelativeTime(tx.date)}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${tx.type === "credit" ? "text-green-600" : "text-foreground"}`}>
                      {tx.type === "credit" ? "+" : "-"}$
                      {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent transactions</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Link External Accounts */}
      <Button
        variant="outline"
        className="w-full justify-between bg-card hover:bg-muted/50 border-0 chase-card-shadow h-14 rounded-xl transition-all duration-150 active:scale-[0.98]"
        onClick={onLinkExternal}
      >
        <span className="font-medium">Link external accounts</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </section>
  )
}
