"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useBanking } from "@/lib/banking-context"
import { Plus, Trash2, CheckCircle2, Calendar, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToastAction } from "@/components/ui/toast"

interface PayBillsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReceiptOpen?: (transactionId: string) => void
}

const defaultPayees = [
  { id: "1", name: "Electric Company", category: "Utilities", lastAmount: 0, accountNumber: "****1234" },
  { id: "2", name: "Water & Sewer", category: "Utilities", lastAmount: 0, accountNumber: "****5678" },
  { id: "3", name: "Gas Company", category: "Utilities", lastAmount: 0, accountNumber: "****9012" },
  { id: "4", name: "Internet Provider", category: "Utilities", lastAmount: 0, accountNumber: "****3456" },
  { id: "5", name: "Phone Bill", category: "Utilities", lastAmount: 0, accountNumber: "****7890" },
  { id: "6", name: "Credit Card - Chase", category: "Credit Cards", lastAmount: 0, accountNumber: "****4567" },
  { id: "7", name: "Credit Card - Amex", category: "Credit Cards", lastAmount: 0, accountNumber: "****8901" },
  { id: "8", name: "Mortgage - Wells Fargo", category: "Loans", lastAmount: 0, accountNumber: "****2345" },
  { id: "9", name: "Auto Loan - Capital One", category: "Loans", lastAmount: 0, accountNumber: "****6789" },
  { id: "10", name: "Insurance - State Farm", category: "Insurance", lastAmount: 0, accountNumber: "****0123" },
  { id: "11", name: "Netflix", category: "Subscriptions", lastAmount: 0, accountNumber: "****4567" },
  { id: "12", name: "Spotify", category: "Subscriptions", lastAmount: 0, accountNumber: "****8901" },
]

interface ScheduledPayment {
  id: string
  payeeId: string
  payeeName: string
  amount: number
  date: string
  frequency: "once" | "weekly" | "monthly"
  status: "scheduled" | "paid" | "failed"
}

export function PayBillsDrawer({ open, onOpenChange, onReceiptOpen }: PayBillsDrawerProps) {
  const [payees, setPayees] = useState(defaultPayees)
  const [selectedPayee, setSelectedPayee] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [frequency, setFrequency] = useState<"once" | "weekly" | "monthly">("once")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"select" | "details" | "confirm" | "success">("select")
  const [isDrawerReady, setIsDrawerReady] = useState(false)
  const { toast } = useToast()

  // Preload data when drawer opens
  useEffect(() => {
    if (open) {
      setIsDrawerReady(true)
    } else {
      setIsDrawerReady(false)
      setStep("select")
      setSelectedPayee("")
      setAmount("")
      setDate("")
      setFrequency("once")
    }
  }, [open])
  const {
    addTransaction,
    accounts,
    addNotification,
    payees: savedPayees,
    addPayee,
    removePayee,
    updateBalance,
    addActivity,
    scheduledPayments: contextScheduledPayments,
    addScheduledPayment,
    cancelScheduledPayment: contextCancelScheduledPayment,
  } = useBanking()
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || "")
  const [newPayeeName, setNewPayeeName] = useState("")
  const [newPayeeAccount, setNewPayeeAccount] = useState("")
  const [newPayeeCategory, setNewPayeeCategory] = useState("Custom")

  const scheduledPayments = contextScheduledPayments || []

  const allPayees = [
    ...payees,
    ...savedPayees.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || "Custom",
      lastAmount: p.lastAmount || 0,
      accountNumber: p.accountNumber || "****0000",
    })),
  ]

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    const duePayments = scheduledPayments.filter((p) => p.status === "scheduled" && p.date <= today)

    if (duePayments.length > 0) {
      addNotification({
        title: "Bill Payment Due",
        message: `You have ${duePayments.length} bill payment(s) due today`,
        type: "warning",
        category: "Bills",
      })
    }
  }, [scheduledPayments, addNotification])

  const handlePayBill = () => {
    if (!selectedPayee || !amount || !date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const payee = allPayees.find((p) => p.id === selectedPayee)
    const account = accounts.find((a) => a.id === selectedAccount)

    if (!payee || !account) return

    if (Number(amount) > account.balance) {
      toast({
        title: "Insufficient Funds",
        description: `Your available balance is $${(account?.balance ?? 0).toFixed(2)}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setStep("confirm")

    // Call real Chase Bank bill pay API
    fetch('/api/bill-pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || ''
      },
      body: JSON.stringify({
        fromAccountId: selectedAccount,
        amount: Number(amount),
        payee: payee.name,
        dueDate: date,
        scheduledDate: frequency !== "once" ? date : undefined,
        frequency: frequency !== "once" ? frequency : undefined,
        category: payee.category,
      })
    })
      .then(res => res.json())
      .then(result => {
        console.log('[v0] Bill pay API response:', result)
        
        updateBalance(selectedAccount, -Number(amount))

        const transaction = addTransaction({
          description: `Bill Payment - ${payee.name}`,
          amount: Number(amount),
          type: "debit",
          category: "Bills & Utilities",
          status: "completed",
          recipientName: payee.name,
          accountFrom: account.name,
          accountId: selectedAccount,
          reference: result.billPaymentId || `BILL-${Date.now()}`,
        })

        if (frequency !== "once") {
          addScheduledPayment({
            payeeId: selectedPayee,
            payeeName: payee.name,
            amount: Number(amount),
            scheduledDate: getNextDate(date, frequency),
            frequency,
            fromAccountId: selectedAccount,
          })
        }

        addNotification({
          title: "Bill Paid",
          message: result.message || `$${Number(amount).toFixed(2)} paid to ${payee.name}`,
          type: "success",
          category: "Bills",
        })

        addActivity({
          action: `Paid $${Number(amount).toFixed(2)} to ${payee.name}`,
          device: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser",
          location: "Current Session",
        })

        setStep("success")
        setIsLoading(false)

        toast({
          title: "Bill Payment Scheduled!",
          description: `Payment of $${Number(amount).toFixed(2)} to ${payee.name} scheduled for ${new Date(date).toLocaleDateString()}`,
          action: (
            <ToastAction altText="View Receipt" onClick={() => onReceiptOpen?.(transaction.id)}>
              Receipt
            </ToastAction>
          ),
        })

        setTimeout(() => {
          resetDrawer()
        }, 2000)
      })
      .catch(error => {
        console.error('[v0] Bill pay error:', error)
        setIsLoading(false)
        addNotification({
          title: "Payment Failed",
          message: error.message || 'Failed to process bill payment',
          type: "alert",
          category: "Errors",
        })
        toast({
          title: "Error",
          description: error.message || 'Failed to pay bill',
          variant: "destructive",
        })
      })
  }

  const getNextDate = (currentDate: string, freq: "weekly" | "monthly"): string => {
    const date = new Date(currentDate)
    if (freq === "weekly") {
      date.setDate(date.getDate() + 7)
    } else {
      date.setMonth(date.getMonth() + 1)
    }
    return date.toISOString().split("T")[0]
  }

  const handleAddPayee = () => {
    if (!newPayeeName || !newPayeeAccount) {
      toast({
        title: "Missing Information",
        description: "Please enter payee name and account number",
        variant: "destructive",
      })
      return
    }

    addPayee({
      name: newPayeeName,
      accountNumber: "****" + newPayeeAccount.slice(-4),
      category: newPayeeCategory,
      lastAmount: 0,
    })

    toast({
      title: "Payee Added",
      description: `${newPayeeName} has been added to your payees`,
    })
    setNewPayeeName("")
    setNewPayeeAccount("")
    setNewPayeeCategory("Custom")
  }

  const handleQuickPay = (payee: (typeof defaultPayees)[0]) => {
    setSelectedPayee(payee.id)
    setAmount(payee.lastAmount.toString())
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setDate(tomorrow.toISOString().split("T")[0])
    setStep("details")
  }

  const cancelScheduledPayment = (paymentId: string) => {
    contextCancelScheduledPayment(paymentId)
    toast({
      title: "Payment Cancelled",
      description: "The scheduled payment has been cancelled",
    })
  }

  const resetDrawer = () => {
    setSelectedPayee("")
    setAmount("")
    setDate("")
    setFrequency("once")
    setStep("select")
    setIsLoading(false)
    setNewPayeeName("")
    setNewPayeeAccount("")
    setNewPayeeCategory("Custom")
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetDrawer()
        onOpenChange(isOpen)
      }}
    >
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="bg-[#0a4fa6] text-white rounded-t-lg">
          <DrawerTitle className="text-white">Pay Bills</DrawerTitle>
        </DrawerHeader>

        <Tabs defaultValue="pay" className="px-4 flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="pay">Pay Bill</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="payees">Payees</TabsTrigger>
            <TabsTrigger value="add">Add New</TabsTrigger>
          </TabsList>

          <TabsContent value="pay" className="space-y-4 overflow-y-auto max-h-[60vh]">
            {step === "select" && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-[#0a4fa6]">Select a payee to pay your bill</div>

                <div className="space-y-2">
                  {allPayees.slice(0, 8).map((payee) => (
                    <div
                      key={payee.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border hover:bg-muted cursor-pointer"
                      onClick={() => handleQuickPay(payee)}
                    >
                      <div>
                        <p className="font-medium">{payee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {payee.category} • {payee.accountNumber}
                        </p>
                      </div>
                      {payee.lastAmount > 0 && <p className="text-sm font-semibold">${payee.lastAmount.toFixed(2)}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === "details" && (
              <div className="space-y-4">
                <Button variant="ghost" onClick={() => setStep("select")} className="mb-2">
                  ← Back to payees
                </Button>

                <div>
                  <Label>From Account</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((a) => a.type === "Checking" || a.type === "checking")
                        .map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} (${(acc.balance ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bill-amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="bill-amount"
                      type="number"
                      placeholder="0,00"
                      className="pl-7 text-xl h-12"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment-date">Payment Date</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={(v: "once" | "weekly" | "monthly") => setFrequency(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">One Time</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full bg-[#0a4fa6]" onClick={handlePayBill} disabled={isLoading}>
                  {isLoading ? "Processing..." : "Schedule Payment"}
                </Button>
              </div>
            )}

            {step === "confirm" && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-[#0a4fa6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-xl font-semibold">Processing Payment...</h3>
              </div>
            )}

            {step === "success" && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-green-600">Payment Scheduled!</h3>
                <p className="text-muted-foreground mt-2">Your bill payment has been scheduled</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-3 overflow-y-auto max-h-[60vh]">
            {scheduledPayments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No scheduled payments</p>
                <p className="text-sm text-muted-foreground">Set up recurring payments to see them here</p>
              </div>
            ) : (
              scheduledPayments.map((payment) => (
                <div key={payment.id} className="p-4 bg-card rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{payment.payeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        ${(payment.amount ?? 0).toFixed(2)} • {payment.frequency}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Next: {new Date(payment.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => cancelScheduledPayment(payment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="payees" className="space-y-2 overflow-y-auto max-h-[60vh]">
            <p className="text-sm text-muted-foreground mb-4">Tap a payee to quick pay</p>
            {allPayees.map((payee) => (
              <div
                key={payee.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer"
                onClick={() => handleQuickPay(payee)}
              >
                <div>
                  <p className="font-medium">{payee.name}</p>
                  <p className="text-xs text-muted-foreground">{payee.category}</p>
                </div>
                {payee.lastAmount > 0 && <p className="text-sm font-medium">${payee.lastAmount.toFixed(2)}</p>}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 mb-4">
              Add a new company or person to pay bills to.
            </div>

            <div>
              <Label>Payee Name *</Label>
              <Input
                placeholder="e.g., Rent - Landlord"
                value={newPayeeName}
                onChange={(e) => setNewPayeeName(e.target.value)}
              />
            </div>

            <div>
              <Label>Account Number *</Label>
              <Input
                placeholder="Your account # with this payee"
                value={newPayeeAccount}
                onChange={(e) => setNewPayeeAccount(e.target.value)}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={newPayeeCategory} onValueChange={setNewPayeeCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Credit Cards">Credit Cards</SelectItem>
                  <SelectItem value="Loans">Loans</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                  <SelectItem value="Subscriptions">Subscriptions</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-[#0a4fa6]" onClick={handleAddPayee}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payee
            </Button>
          </TabsContent>
        </Tabs>

        <DrawerFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
