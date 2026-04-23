"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { PlusCircle, CreditCard, Wallet, ChevronRight, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddAccountDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccountAdded?: () => void
}

export function AddAccountDrawer({ open, onOpenChange, onAccountAdded }: AddAccountDrawerProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<"select" | "details" | "confirm" | "success">("select")
  const [selectedType, setSelectedType] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [accountDetails, setAccountDetails] = useState({
    fundingSource: "existing-account",
    initialDeposit: "0",
    linkExternally: false,
  })

  const accountTypes: Record<string, { name: string; description: string; minBalance: string; apy: string }> = {
    checking: {
      name: "Checking Account",
      description: "No monthly fees, unlimited transactions",
      minBalance: "$0",
      apy: "Variable",
    },
    savings: {
      name: "Savings Account",
      description: "Earn interest on your savings",
      minBalance: "$0",
      apy: "4.25% APY",
    },
    money_market: {
      name: "Money Market Account",
      description: "Higher yields with check writing",
      minBalance: "$2,500",
      apy: "5.00% APY",
    },
  }

  const handleSelectType = (type: string) => {
    setSelectedType(type)
    setStep("details")
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      // Call backend API to open account
      const response = await fetch("/api/accounts/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: selectedType,
          initialDeposit: parseFloat(accountDetails.initialDeposit) || 0,
          fundingSource: accountDetails.fundingSource,
          linkExternal: accountDetails.linkExternally,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to open account")
      }

      console.log("[v0] Account opened successfully:", data)

      toast({
        title: "Account Created",
        description: `Your new ${accountTypes[selectedType]?.name} has been successfully opened.`,
      })

      setStep("success")
      setTimeout(() => {
        setIsLoading(false)
        onAccountAdded?.()
        resetDrawer()
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      console.error("[v0] Account opening error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open account",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const resetDrawer = () => {
    setStep("select")
    setSelectedType("")
    setAccountDetails({
      fundingSource: "existing-account",
      initialDeposit: "0",
      linkExternally: false,
    })
  }

  const handleClose = () => {
    resetDrawer()
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {step === "select" && "Open a New Account"}
            {step === "details" && "Account Details"}
            {step === "confirm" && "Review"}
            {step === "success" && "Account Created"}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Step 1: Select Account Type */}
          {step === "select" && (
            <div className="space-y-3">
              {Object.entries(accountTypes).map(([key, account]) => (
                <button
                  key={key}
                  onClick={() => handleSelectType(key)}
                  className="w-full p-4 border border-gray-200 rounded-xl hover:border-[#117aca] hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{account.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Min: {account.minBalance}</span>
                        <span>APY: {account.apy}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#117aca]" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Account Details */}
          {step === "details" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Funding Source</label>
                <select
                  value={accountDetails.fundingSource}
                  onChange={(e) =>
                    setAccountDetails({ ...accountDetails, fundingSource: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#117aca] focus:border-transparent"
                >
                  <option value="existing-account">From Existing Chase Account</option>
                  <option value="external-transfer">External Bank Transfer</option>
                  <option value="no-deposit">No Initial Deposit</option>
                </select>
              </div>

              {accountDetails.fundingSource !== "no-deposit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Initial Deposit</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={accountDetails.initialDeposit}
                    onChange={(e) =>
                      setAccountDetails({ ...accountDetails, initialDeposit: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#117aca] focus:border-transparent"
                    placeholder="Enter amount"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accountDetails.linkExternally}
                  onChange={(e) =>
                    setAccountDetails({ ...accountDetails, linkExternally: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Link external bank account</span>
              </label>

              <Button
                onClick={() => setStep("confirm")}
                className="w-full bg-[#117aca] hover:bg-[#0f5fa8] text-white"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Type:</span>
                  <span className="font-semibold text-gray-900">{accountTypes[selectedType]?.name}</span>
                </div>
                {accountDetails.fundingSource !== "no-deposit" && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Initial Deposit:</span>
                    <span className="font-semibold text-gray-900">${parseFloat(accountDetails.initialDeposit || "0").toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Funding Source:</span>
                  <span className="font-semibold text-gray-900 capitalize">{accountDetails.fundingSource.replace("-", " ")}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                By opening this account, you agree to Chase's account terms and conditions.
              </p>

              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full bg-[#117aca] hover:bg-[#0f5fa8] text-white"
              >
                {isLoading ? "Creating Account..." : "Open Account"}
              </Button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Account Created Successfully!</p>
                <p className="text-sm text-gray-600 mt-1">
                  Your new {accountTypes[selectedType]?.name} is now active.
                </p>
              </div>
            </div>
          )}
        </div>

        {step !== "success" && (
          <DrawerFooter>
            {step !== "select" && (
              <Button variant="outline" onClick={() => setStep("select")} disabled={isLoading}>
                Back
              </Button>
            )}
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
