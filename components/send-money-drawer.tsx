"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useBanking } from "@/lib/banking-context"
import { Search, Clock, Plus, User, CheckCircle2, AlertCircle } from "lucide-react"
import { ToastAction } from "@/components/ui/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SendMoneyDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReceiptOpen?: (transactionId: string) => void
}

export function SendMoneyDrawer({ open, onOpenChange, onReceiptOpen }: SendMoneyDrawerProps) {
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [step, setStep] = useState<"select" | "amount" | "confirm" | "success">("select")
  const [selectedContact, setSelectedContact] = useState<(typeof recentContacts)[0] | null>(null)
  const { toast } = useToast()
  const { addTransaction, accounts, zelleContacts, addZelleContact, addNotification, updateBalance, addActivity } =
    useBanking()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || "")
  const [isDrawerReady, setIsDrawerReady] = useState(false)

  const [showAddContact, setShowAddContact] = useState(false)
  const [newContactName, setNewContactName] = useState("")
  const [newContactEmail, setNewContactEmail] = useState("")
  const [newContactPhone, setNewContactPhone] = useState("")

  // Preload data when drawer opens for smooth rendering
  useEffect(() => {
    if (open) {
      setIsDrawerReady(true)
    } else {
      // Reset when closing
      setIsDrawerReady(false)
      setStep("select")
      setRecipient("")
      setAmount("")
      setMemo("")
      setSearchQuery("")
      setSelectedContact(null)
    }
  }, [open])

  const recentContacts = [
    { id: "1", name: "Sarah Johnson", email: "sarah.j@email.com", phone: "", avatar: "SJ" },
    { id: "2", name: "Mike Chen", email: "", phone: "(555) 234-5678", avatar: "MC" },
    { id: "3", name: "Emma Wilson", email: "emma.w@email.com", phone: "", avatar: "EW" },
    { id: "4", name: "David Brown", email: "", phone: "(555) 345-6789", avatar: "DB" },
    { id: "5", name: "Lisa Garcia", email: "lisa.g@email.com", phone: "", avatar: "LG" },
    ...zelleContacts.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      avatar: c.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    })),
  ]

  const filteredContacts = recentContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.phone && contact.phone.includes(searchQuery)),
  )

  const handleSelectContact = (contact: (typeof recentContacts)[0]) => {
    setSelectedContact(contact)
    setRecipient(contact.email || contact.phone || "")
    setStep("amount")
  }

  const handleAddNewContact = () => {
    if (!newContactName || (!newContactEmail && !newContactPhone)) {
      toast({
        title: "Missing Information",
        description: "Please enter name and email or phone number",
        variant: "destructive",
      })
      return
    }

    addZelleContact({
      name: newContactName,
      email: newContactEmail || undefined,
      phone: newContactPhone || undefined,
    })

    toast({
      title: "Contact Added",
      description: `${newContactName} has been added to your Zelle contacts`,
    })

    const newContact = {
      id: Date.now().toString(),
      name: newContactName,
      email: newContactEmail,
      phone: newContactPhone,
      avatar: newContactName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    }
    handleSelectContact(newContact)

    setShowAddContact(false)
    setNewContactName("")
    setNewContactEmail("")
    setNewContactPhone("")
  }

  const handleSend = () => {
    if (!recipient || !amount) {
      toast({
        title: "Missing Information",
        description: "Please enter recipient and amount",
        variant: "destructive",
      })
      return
    }

    const sendAmount = Number(amount)
    if (sendAmount > 2500) {
      toast({
        title: "Limit Exceeded",
        description: "Zelle daily limit is $2,500",
        variant: "destructive",
      })
      return
    }

    const account = accounts.find((a) => a.id === selectedAccount)
    if (!account || sendAmount > account.balance) {
      toast({
        title: "Insufficient Funds",
        description: `Your available balance is $${(account?.balance ?? 0).toFixed(2)}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setStep("confirm")

    // Call real Chase Bank Zelle API
    fetch('/api/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || ''
      },
      body: JSON.stringify({
        action: 'zelle',
        fromAccountId: selectedAccount,
        amount: sendAmount,
        recipientEmail: selectedContact?.email || recipient,
        recipientPhone: selectedContact?.phone,
        recipientName: selectedContact?.name || recipient,
      })
    })
      .then(res => res.json())
      .then(result => {
        console.log('[v0] Zelle API response:', result)
        
        updateBalance(selectedAccount, -sendAmount)

        const transaction = addTransaction({
          description: `Zelle to ${selectedContact?.name || recipient}`,
          amount: sendAmount,
          type: "debit",
          category: "Transfers",
          status: "completed",
          recipientName: selectedContact?.name || recipient,
          reference: result.zelleTransferId || `ZELLE-${Date.now()}`,
          accountId: selectedAccount,
          accountFrom: account.name,
        })

        addNotification({
          title: "Money Sent",
          message: result.message || `$${sendAmount.toFixed(2)} sent to ${selectedContact?.name || recipient} via Zelle`,
          type: "success",
          category: "Transfers",
        })

        addActivity({
          action: `Sent $${sendAmount.toFixed(2)} to ${selectedContact?.name || recipient} via Zelle`,
          device: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser",
          location: "Current Session",
        })

        setStep("success")
        setIsLoading(false)

        toast({
          title: "Money Sent!",
          description: `Successfully sent $${sendAmount.toFixed(2)} via Zelle`,
          action: (
            <ToastAction altText="View Receipt" onClick={() => onReceiptOpen?.(transaction.id)}>
              Receipt
            </ToastAction>
          ),
        })

        setTimeout(() => {
          resetDrawer()
          onOpenChange(false)
        }, 2000)
      })
      .catch(error => {
        console.error('[v0] Zelle transfer error:', error)
        setIsLoading(false)
        addNotification({
          title: "Transfer Failed",
          message: error.message || 'Failed to send money via Zelle',
          type: "alert",
          category: "Errors",
        })
        toast({
          title: "Error",
          description: error.message || 'Failed to send money',
          variant: "destructive",
        })
      })
  }

  const resetDrawer = () => {
    setRecipient("")
    setAmount("")
    setMemo("")
    setSearchQuery("")
    setStep("select")
    setSelectedContact(null)
    setIsLoading(false)
    setShowAddContact(false)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetDrawer()
        onOpenChange(isOpen)
      }}
    >
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="bg-[#0a4fa6] text-white rounded-t-lg">
          <DrawerTitle className="text-white">Send with Zelle®</DrawerTitle>
          <div className="flex items-center gap-2 mt-2">
            {["select", "amount", "confirm", "success"].map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  ["select", "amount", "confirm", "success"].indexOf(step) >= i ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </DrawerHeader>

        <div className="px-4 space-y-4 overflow-y-auto pb-4 flex-1 overscroll-contain touch-pan-y scroll-smooth">
          {step === "select" && !showAddContact && (
            <>
              <div>
                <Label htmlFor="recipient">Search contacts or enter email/phone</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recipient"
                    placeholder="Enter email, mobile, or search contacts"
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-12 bg-transparent"
                onClick={() => setShowAddContact(true)}
              >
                <Plus className="h-4 w-4 text-[#0a4fa6]" />
                Add New Contact
              </Button>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm text-muted-foreground">Recent & Saved Contacts</Label>
                </div>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border"
                      onClick={() => handleSelectContact(contact)}
                    >
                      <div className="h-10 w-10 rounded-full bg-[#0a4fa6] flex items-center justify-center text-sm font-medium text-white">
                        {contact.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.email || contact.phone}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                  {filteredContacts.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No contacts found</p>
                  )}
                </div>
              </div>

              {searchQuery && searchQuery.includes("@") && (
                <Button
                  className="w-full bg-[#0a4fa6]"
                  onClick={() => {
                    setRecipient(searchQuery)
                    setSelectedContact({
                      id: "new",
                      name: searchQuery,
                      email: searchQuery,
                      phone: "",
                      avatar: searchQuery[0].toUpperCase(),
                    })
                    setStep("amount")
                  }}
                >
                  Send to {searchQuery}
                </Button>
              )}
            </>
          )}

          {step === "select" && showAddContact && (
            <div className="space-y-4">
              <Button variant="ghost" onClick={() => setShowAddContact(false)} className="mb-2">
                ← Back to contacts
              </Button>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-1">Add New Zelle Contact</h3>
                <p className="text-sm text-muted-foreground">Enter their details to send money</p>
              </div>

              <div>
                <Label>Name *</Label>
                <Input
                  placeholder="Full name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                />
              </div>

              <Button className="w-full bg-[#0a4fa6]" onClick={handleAddNewContact}>
                <Plus className="h-4 w-4 mr-2" />
                Add & Send Money
              </Button>
            </div>
          )}

          {step === "amount" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <div className="h-12 w-12 rounded-full bg-[#0a4fa6] flex items-center justify-center text-lg font-medium text-white">
                  {selectedContact?.avatar || <User className="h-6 w-6" />}
                </div>
                <div>
                  <p className="font-semibold">{selectedContact?.name || recipient}</p>
                  <p className="text-sm text-muted-foreground">{selectedContact?.email || selectedContact?.phone}</p>
                </div>
              </div>

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
                          {acc.name} (${(acc.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-2xl text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    type="number"
                    className="pl-8 text-3xl h-16 font-semibold"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Daily limit: $2,500</p>
                {Number(amount) > 2500 && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Exceeds daily limit
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="memo">Memo (optional)</Label>
                <Input
                  id="memo"
                  placeholder="What's this for?"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Quick amounts</Label>
                <div className="flex gap-2">
                  {[20, 50, 100, 200, 500].map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(quickAmount.toString())}
                      className="flex-1"
                    >
                      ${quickAmount}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#0a4fa6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-xl font-semibold">Sending Money...</h3>
                <p className="text-muted-foreground mt-2">
                  Sending ${Number(amount).toFixed(2)} to {selectedContact?.name}
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-green-600">Money Sent!</h3>
                <p className="text-muted-foreground mt-2">
                  ${Number(amount).toFixed(2)} was sent to {selectedContact?.name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">They should receive it within minutes</p>
              </div>
            </div>
          )}
        </div>

        {step === "amount" && (
          <DrawerFooter>
            <Button
              onClick={handleSend}
              disabled={isLoading || !amount || Number(amount) <= 0 || Number(amount) > 2500}
              className="h-12 bg-[#0a4fa6]"
            >
              {isLoading ? "Sending..." : `Send $${amount || "0.00"}`}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep("select")
                setSelectedContact(null)
              }}
            >
              Back
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
