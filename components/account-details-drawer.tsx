"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Download,
  Filter,
  Search,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
} from "lucide-react"
import { useBanking } from "@/lib/banking-context"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AccountDetailsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId?: string
  onReceiptOpen?: (transactionId: string) => void
}

export function AccountDetailsDrawer({ open, onOpenChange, accountId, onReceiptOpen }: AccountDetailsDrawerProps) {
  const { accounts, transactions } = useBanking()
  const [showBalance, setShowBalance] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all")
  const [selectedPeriod, setSelectedPeriod] = useState("30")

  const account = accountId ? accounts.find((a) => a.id === accountId) : accounts[0]

  if (!account) return null

  const accountTransactions = transactions
    .filter((tx) => {
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === "all" || tx.type === filterType
      const txDate = new Date(tx.date)
      const daysAgo = (Date.now() - txDate.getTime()) / (1000 * 60 * 60 * 24)
      const matchesPeriod = daysAgo <= Number.parseInt(selectedPeriod)
      return matchesSearch && matchesType && matchesPeriod
    })
    .slice(0, 50)

  const totalIncoming = transactions.filter((tx) => tx.type === "credit").reduce((sum, tx) => sum + tx.amount, 0)

  const totalOutgoing = transactions.filter((tx) => tx.type === "debit").reduce((sum, tx) => sum + tx.amount, 0)

  const pendingTransactions = transactions.filter((tx) => tx.status === "pending")

  const formatBalance = (balance?: number) => {
    if (!showBalance) return "••••••"
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh]">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-lg">{account.name}</DrawerTitle>
              <p className="text-sm text-muted-foreground">...{account.accountNumber}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto px-4 pb-6">
          {/* Balance Card - Updated all € to $ */}
          <Card className="p-6 my-4 bg-gradient-to-r from-[#0a4fa6] to-[#117aca] text-white">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/80 mb-1">Available Balance</p>
                <p className="text-4xl font-bold">${formatBalance(account.availableBalance ?? account.balance)}</p>
              </div>
              <div className="border-t border-white/20 pt-3">
                <p className="text-sm text-white/80 mb-1">Present Balance</p>
                <p className="text-2xl font-semibold">${formatBalance(account.balance)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div>
                <p className="text-white/70">Account Number</p>
                <p className="font-medium">
                  {account.id === "1" ? account.accountNumber : `...${account.accountNumber}`}
                </p>
              </div>
              <div>
                <p className="text-white/70">Routing Number</p>
                <p className="font-medium">{account.routingNumber}</p>
              </div>
            </div>
          </Card>

          {/* Quick Stats - Updated all € to $ */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="p-3 text-center">
              <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="font-semibold text-green-600">${formatBalance(totalIncoming)}</p>
            </Card>
            <Card className="p-3 text-center">
              <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="font-semibold text-red-500">${formatBalance(totalOutgoing)}</p>
            </Card>
            <Card className="p-3 text-center">
              <Calendar className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="font-semibold">{pendingTransactions.length}</p>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" className="flex-1 bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Statements
            </Button>
            <Button variant="outline" size="sm" className="flex-1 bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </Button>
          </div>

          <Tabs defaultValue="transactions" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="details">Account Details</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterType} onValueChange={(v: "all" | "credit" | "debit") => setFilterType(v)}>
                  <SelectTrigger className="w-28">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="credit">Income</SelectItem>
                    <SelectItem value="debit">Expenses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>

              {/* Transactions List - Updated all € to $ */}
              <div className="space-y-2">
                {accountTransactions.length > 0 ? (
                  accountTransactions.map((transaction) => (
                    <Card
                      key={transaction.id}
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onReceiptOpen?.(transaction.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              transaction.type === "credit" ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            {transaction.type === "credit" ? (
                              <ArrowDownLeft className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(transaction.status)}`}>
                                {transaction.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{transaction.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-semibold ${transaction.type === "credit" ? "text-green-600" : "text-foreground"}`}
                          >
                            {transaction.type === "credit" ? "+" : "-"}${transaction.amount.toFixed(2)}
                          </p>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No transactions found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Account Name</span>
                    <span className="font-medium">{account.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Account Type</span>
                    <span className="font-medium capitalize">{account.type}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Account Number</span>
                    <span className="font-medium">
                      {account.id === "1" ? account.accountNumber : `...${account.accountNumber}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Routing Number</span>
                    <span className="font-medium">{account.routingNumber}</span>
                  </div>
                  {account.interestRate && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Interest Rate (APY)</span>
                      <span className="font-medium">{account.interestRate}%</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Available Balance</span>
                    <span className="font-medium text-green-600">
                      ${formatBalance(account.availableBalance ?? account.balance)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Present Balance</span>
                    <span className="font-medium text-blue-600">${formatBalance(account.balance)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">Account Features</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span>Direct Deposit</span>
                    <span className="text-green-600 text-sm font-medium">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Overdraft Protection</span>
                    <span className="text-green-600 text-sm font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Paperless Statements</span>
                    <span className="text-green-600 text-sm font-medium">Enrolled</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Mobile Deposit</span>
                    <span className="text-green-600 text-sm font-medium">Enabled</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-4">Monthly Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Total Deposits</span>
                    <span className="font-medium text-green-600">+${formatBalance(totalIncoming)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Total Withdrawals</span>
                    <span className="font-medium text-red-500">-${formatBalance(totalOutgoing)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Net Change</span>
                    <span
                      className={`font-medium ${totalIncoming - totalOutgoing >= 0 ? "text-green-600" : "text-red-500"}`}
                    >
                      {totalIncoming - totalOutgoing >= 0 ? "+" : "-"}$
                      {formatBalance(Math.abs(totalIncoming - totalOutgoing))}
                    </span>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
