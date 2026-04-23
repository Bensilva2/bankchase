"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useBanking } from "@/lib/banking-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, CheckCircle } from "lucide-react"
import { BankSelectorModal } from "@/components/bank-selector-modal"
import { ToastAction } from "@/components/ui/toast"
import type { Bank } from "@/lib/bank-data"

interface TransferDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReceiptOpen?: (transactionId: string) => void
}

export function TransferDrawer({ open, onOpenChange, onReceiptOpen }: TransferDrawerProps) {
  const {
    accounts,
    transferFunds,
    addTransaction,
    externalRecipients,
    addExternalRecipient,
    removeExternalRecipient,
    selectedBank,
    setSelectedBank,
  } = useBanking()
  const { toast } = useToast()

  const [fromAccount, setFromAccount] = useState(accounts[0]?.id || "")
  const [toAccount, setToAccount] = useState(accounts[1]?.id || "")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [extRouting, setExtRouting] = useState("")
  const [extAccount, setExtAccount] = useState("")
  const [extName, setExtName] = useState("")
  const [extBankName, setExtBankName] = useState("")
  const [saveRecipient, setSaveRecipient] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null)
  const [extAccountType, setExtAccountType] = useState("Checking")

  const [bankSelectorOpen, setBankSelectorOpen] = useState(false)
  const [isDrawerReady, setIsDrawerReady] = useState(false)

  // Preload data when drawer opens
  useEffect(() => {
    if (open) {
      setIsDrawerReady(true)
    } else {
      setIsDrawerReady(false)
    }
  }, [open])

  const validateRoutingNumber = (routing: string) => /^\d{9}$/.test(routing)
  const validateAccountNumber = (account: string) => /^\d{8,}$/.test(account)

  const handleInternalTransfer = () => {
    if (!fromAccount || !toAccount || !amount || Number(amount) <= 0) {
      toast({
        title: "Invalid Transfer",
        description: "Please fill in all fields with valid amounts",
        variant: "destructive",
      })
      return
    }

    const fromAccountData = accounts.find((a) => a.id === fromAccount)
    const toAccountData = accounts.find((a) => a.id === toAccount)

    if (!fromAccountData || !toAccountData) return

    if (Number(amount) > fromAccountData.balance) {
      toast({
        title: "Insufficient Funds",
        description: `Your available balance is $${(fromAccountData?.balance ?? 0).toFixed(2)}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    
    // Call real Chase Bank transfer API
    fetch('/api/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || ''
      },
      body: JSON.stringify({
        action: 'internal',
        fromAccountId: fromAccount,
        toAccountId: toAccount,
        amount: Number(amount),
        description: `Transfer to ${toAccountData.name}`,
      })
    })
      .then(res => res.json())
      .then(result => {
        console.log('[v0] Transfer API response:', result)
        
        const transaction = transferFunds(fromAccount, toAccount, Number(amount), `Transfer to ${toAccountData.name}`, 0)

        toast({
          title: "Transfer Successful",
          description: result.message || `Transferred $${Number(amount).toFixed(2)} successfully.`,
          action: (
            <ToastAction altText="View Receipt" onClick={() => onReceiptOpen?.(transaction.id)}>
              Receipt
            </ToastAction>
          ),
        })
      setIsLoading(false)
      onOpenChange(false)
      setAmount("")
      setFromAccount(accounts[0]?.id || "")
      setToAccount(accounts[1]?.id || "")
    }, 1000)
  }

  const handleExternalTransfer = () => {
    if (!amount || !extRouting || !extAccount || !extName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!validateRoutingNumber(extRouting)) {
      toast({
        title: "Invalid Routing Number",
        description: "Routing number must be exactly 9 digits",
        variant: "destructive",
      })
      return
    }

    if (!validateAccountNumber(extAccount)) {
      toast({
        title: "Invalid Account Number",
        description: "Account number must be at least 8 digits",
        variant: "destructive",
      })
      return
    }

    const fromAccountData = accounts.find((a) => a.id === fromAccount)
    if (fromAccountData && Number(amount) > fromAccountData.balance) {
      toast({
        title: "Insufficient Funds",
        description: `Your available balance is $${(fromAccountData?.balance ?? 0).toFixed(2)}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      if (saveRecipient) {
        addExternalRecipient({
          name: extName,
          bankName: extBankName || "Unknown Bank",
          accountNumber: "***" + extAccount.slice(-4),
          routingNumber: extRouting,
          accountType: extAccountType,
        })
      }

      const transaction = addTransaction({
        description: `Transfer to ${extName} (${extBankName || "External"})`,
        amount: Number(amount),
        type: "debit",
        category: "Transfers",
        status: "completed",
        recipientName: extName,
        accountFrom: fromAccountData?.name,
        reference: `EXT-${Date.now()}`,
      })

      toast({
        title: "External Transfer Initiated",
        description: `Sending $${Number(amount).toFixed(2)} to ${extName}. Funds will arrive in 1-3 business days.`,
        action: (
          <ToastAction altText="View Receipt" onClick={() => onReceiptOpen?.(transaction.id)}>
            Receipt
          </ToastAction>
        ),
      })

      setIsLoading(false)
      onOpenChange(false)
      setAmount("")
      setExtAccount("")
      setExtRouting("")
      setExtName("")
      setExtBankName("")
      setSaveRecipient(false)
      setFromAccount(accounts[0]?.id || "")
    }, 1500)
  }

  const handleTransferToSavedRecipient = () => {
    if (!selectedRecipient || !amount) {
      toast({
        title: "Missing Information",
        description: "Please select a recipient and enter an amount",
        variant: "destructive",
      })
      return
    }

    const recipient = externalRecipients.find((r) => r.id === selectedRecipient)
    const fromAccountData = accounts.find((a) => a.id === fromAccount)

    if (!recipient || !fromAccountData) return

    if (Number(amount) > fromAccountData.balance) {
      toast({
        title: "Insufficient Funds",
        description: `Your available balance is $${(fromAccountData?.balance ?? 0).toFixed(2)}`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      const transaction = addTransaction({
        description: `Transfer to ${recipient.name} (${recipient.bankName})`,
        amount: Number(amount),
        type: "debit",
        category: "Transfers",
        status: "completed",
        recipientName: recipient.name,
        accountFrom: fromAccountData.name,
        reference: `SAVED-${Date.now()}`,
        recipientId: selectedRecipient,
      })

      toast({
        title: "Transfer Sent Successfully",
        description: `$${Number(amount).toFixed(2)} sent to ${recipient.name}. Funds will arrive in 1-3 business days.`,
        action: (
          <ToastAction altText="View Receipt" onClick={() => onReceiptOpen?.(transaction.id)}>
            Receipt
          </ToastAction>
        ),
      })

      setIsLoading(false)
      onOpenChange(false)
      setAmount("")
      setSelectedRecipient(null)
    }, 1500)
  }

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank({
      id: bank.id,
      name: bank.name,
      routing: bank.routing,
      state: bank.state,
      type: bank.type,
    })
    setExtBankName(bank.name)
    setExtRouting(bank.routing)
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] h-[90dvh] overflow-hidden">
          <DrawerHeader>
            <DrawerTitle>Transfer Funds</DrawerTitle>
          </DrawerHeader>

          <Tabs defaultValue="internal" className="px-4 flex-1 overflow-auto overscroll-contain touch-pan-y scroll-smooth">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="internal">Between Accounts</TabsTrigger>
              <TabsTrigger value="external">Another Bank</TabsTrigger>
              <TabsTrigger value="saved">Saved Recipients</TabsTrigger>
            </TabsList>

            {/* Internal Transfer Tab */}
            <TabsContent value="internal" className="space-y-4">
              <div className="space-y-2">
                <Label>From Account</Label>
                <Select value={fromAccount} onValueChange={setFromAccount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} (${(acc.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To Account</Label>
                <Select value={toAccount} onValueChange={setToAccount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((acc) => acc.id !== fromAccount)
                      .map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} (${(acc.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    type="number"
                    className="pl-8"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              <Button className="w-full mt-4" onClick={handleInternalTransfer} disabled={isLoading}>
                {isLoading ? "Transferring..." : "Transfer Funds"}
              </Button>
            </TabsContent>

            {/* External Transfer Tab */}
            <TabsContent value="external" className="space-y-4 pb-4">
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-2">
                Transfer to another bank account using the recipient's routing and account number.
              </div>

              <div className="space-y-2">
                <Label>From Account</Label>
                <Select value={fromAccount} onValueChange={setFromAccount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} (${(acc.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recipient Name *</Label>
                <Input placeholder="e.g. John Doe" value={extName} onChange={(e) => setExtName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Recipient's Bank *</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setBankSelectorOpen(true)}
                >
                  {selectedBank ? (
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{selectedBank.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {selectedBank.state} • Routing: {selectedBank.routing}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Select a bank from our directory...</span>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Routing Number *</Label>
                  <Input
                    placeholder="9 digits"
                    value={extRouting}
                    onChange={(e) => setExtRouting(e.target.value)}
                    maxLength={9}
                  />
                  {extRouting && !validateRoutingNumber(extRouting) && (
                    <p className="text-xs text-red-500">Must be exactly 9 digits</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Account Number *</Label>
                  <Input
                    placeholder="Min 8 digits"
                    value={extAccount}
                    onChange={(e) => setExtAccount(e.target.value)}
                  />
                  {extAccount && !validateAccountNumber(extAccount) && (
                    <p className="text-xs text-red-500">Must be at least 8 digits</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={extAccountType} onValueChange={setExtAccountType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Checking">Checking</SelectItem>
                    <SelectItem value="Savings">Savings</SelectItem>
                    <SelectItem value="Money Market">Money Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    type="number"
                    className="pl-8"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveRecipient"
                  checked={saveRecipient}
                  onChange={(e) => setSaveRecipient(e.target.checked)}
                />
                <Label htmlFor="saveRecipient" className="cursor-pointer">
                  Save this recipient for future transfers
                </Label>
              </div>

              <Button className="w-full mt-4" onClick={handleExternalTransfer} disabled={isLoading}>
                {isLoading ? "Initiating..." : "Initiate Transfer"}
              </Button>
            </TabsContent>

            {/* Saved Recipients Tab */}
            <TabsContent value="saved" className="space-y-4 pb-4">
              {externalRecipients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No saved recipients yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Save recipients when making external transfers for quicker future transfers
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>From Account</Label>
                    <Select value={fromAccount} onValueChange={setFromAccount}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} (${(acc.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Recipient</Label>
                    <div className="space-y-2">
                      {externalRecipients.map((recipient) => (
                        <div
                          key={recipient.id}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                            selectedRecipient === recipient.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedRecipient(recipient.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                {selectedRecipient === recipient.id && <CheckCircle className="h-4 w-4 text-primary" />}
                                {recipient.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {recipient.bankName} • {recipient.accountType} {recipient.accountNumber}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Added {new Date(recipient.addedDate).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeExternalRecipient(recipient.id)
                                setSelectedRecipient(null)
                                toast({
                                  title: "Recipient Removed",
                                  description: `${recipient.name} has been removed from your saved recipients.`,
                                })
                              }}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Enter Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {[100, 250, 500, 1000].map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(quickAmount.toString())}
                        className="flex-1 text-xs"
                      >
                        ${quickAmount}
                      </Button>
                    ))}
                  </div>

                  <Button className="w-full mt-4" onClick={handleTransferToSavedRecipient} disabled={isLoading}>
                    {isLoading ? "Processing..." : `Send $${amount || "0.00"}`}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>

          <DrawerFooter className="pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Bank Selector Modal */}
      <BankSelectorModal open={bankSelectorOpen} onOpenChange={setBankSelectorOpen} onSelectBank={handleSelectBank} />
    </>
  )
}
