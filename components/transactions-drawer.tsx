"use client"

import { useState, useMemo } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Filter, Download, Receipt, ArrowUpRight, ArrowDownLeft, ChevronRight } from "lucide-react"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"

interface TransactionsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReceiptOpen: (transactionId: string) => void
}

export function TransactionsDrawer({ open, onOpenChange, onReceiptOpen }: TransactionsDrawerProps) {
  const { transactions, accounts } = useBanking()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all")
  const [filterAccount, setFilterAccount] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month" | "year">("all")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "amount">("date")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category))
    return Array.from(cats)
  }, [transactions])

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.reference?.toLowerCase().includes(query) ||
          t.recipientName?.toLowerCase().includes(query),
      )
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType)
    }

    // Account filter
    if (filterAccount !== "all") {
      filtered = filtered.filter((t) => t.accountId === filterAccount)
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((t) => t.category === filterCategory)
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((t) => t.status === filterStatus)
    }

    // Date range filter
    const now = new Date()
    if (dateRange !== "all") {
      filtered = filtered.filter((t) => {
        const txDate = new Date(t.date)
        switch (dateRange) {
          case "today":
            return txDate.toDateString() === now.toDateString()
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return txDate >= weekAgo
          case "month":
            return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
          case "year":
            return txDate.getFullYear() === now.getFullYear()
          default:
            return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB
      } else {
        return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount
      }
    })

    return filtered
  }, [transactions, searchQuery, filterType, filterAccount, filterCategory, filterStatus, dateRange, sortBy, sortOrder])

  // Calculate totals
  const totals = useMemo(() => {
    const credits = filteredTransactions.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount, 0)
    const debits = filteredTransactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0)
    return { credits, debits, net: credits - debits }
  }, [filteredTransactions])

  const handleExportCSV = () => {
    const headers = ["Date", "Description", "Category", "Type", "Amount", "Status", "Reference"]
    const rows = filteredTransactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.type,
      t.amount.toFixed(2),
      t.status,
      t.reference || "",
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chase-transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Transactions Exported",
      description: `${filteredTransactions.length} transactions exported to CSV.`,
    })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setFilterType("all")
    setFilterAccount("all")
    setFilterCategory("all")
    setFilterStatus("all")
    setDateRange("all")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const getTransactionIcon = (type: string, category: string) => {
    if (type === "credit") {
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />
    }
    return <ArrowUpRight className="h-4 w-4 text-red-500" />
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh] flex flex-col">
        <DrawerHeader className="border-b bg-gradient-to-r from-[#0a4fa6] to-[#117aca] text-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DrawerTitle className="text-white text-lg">All Transactions</DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto">
          {/* Search and Filter Bar */}
          <div className="sticky top-0 bg-background z-10 p-4 border-b space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-primary text-white" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filters</span>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1 text-xs">
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="credit">Money In</SelectItem>
                        <SelectItem value="debit">Money Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Account</Label>
                    <Select value={filterAccount} onValueChange={setFilterAccount}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Accounts</SelectItem>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
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

                <div className="space-y-1">
                  <Label className="text-xs">Date Range</Label>
                  <div className="flex gap-1">
                    {[
                      { value: "all", label: "All" },
                      { value: "today", label: "Today" },
                      { value: "week", label: "Week" },
                      { value: "month", label: "Month" },
                      { value: "year", label: "Year" },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        variant={dateRange === opt.value ? "default" : "outline"}
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => setDateRange(opt.value as any)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Sort By</Label>
                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Order</Label>
                    <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Newest First</SelectItem>
                        <SelectItem value="asc">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{filteredTransactions.length} transactions</span>
              <div className="flex gap-3">
                <span className="text-green-600">+${totals.credits.toFixed(2)}</span>
                <span className="text-red-500">-${totals.debits.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="divide-y">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No transactions found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <button
                  key={tx.id}
                  className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                  onClick={() => onReceiptOpen(tx.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.type === "credit" ? "bg-green-100" : "bg-red-50"
                      }`}
                    >
                      {getTransactionIcon(tx.type, tx.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{tx.description}</p>
                        <span
                          className={`font-semibold whitespace-nowrap ${
                            tx.type === "credit" ? "text-green-600" : "text-foreground"
                          }`}
                        >
                          {tx.type === "credit" ? "+" : "-"}${tx.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{tx.category}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
