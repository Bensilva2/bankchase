"use client"

import { Plus, Send, FileText, CreditCard, ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuickActionsProps {
  onSendMoney: () => void
  onDepositChecks: () => void
  onPayBills: () => void
  onAddAccount: () => void
  onTransfer?: () => void
}

export function QuickActions({
  onSendMoney,
  onDepositChecks,
  onPayBills,
  onAddAccount,
  onTransfer,
}: QuickActionsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide momentum-scroll">
      <Button
        variant="outline"
        className="flex items-center justify-center bg-card border-0 chase-card-shadow hover:bg-muted/50 rounded-full h-12 w-12 p-0 flex-shrink-0 transition-transform duration-150 active:scale-90"
        onClick={onAddAccount}
      >
        <Plus className="h-5 w-5 text-[#0a4fa6]" />
      </Button>
      <Button
        variant="outline"
        className="flex items-center gap-2 whitespace-nowrap bg-card border-0 chase-card-shadow hover:bg-muted/50 rounded-full h-12 px-5 font-medium flex-shrink-0 transition-transform duration-150 active:scale-95"
        onClick={onSendMoney}
      >
        <Send className="h-4 w-4 text-[#0a4fa6]" />
        <span>Send | Zelle</span>
      </Button>
      {onTransfer && (
        <Button
          variant="outline"
          className="flex items-center gap-2 whitespace-nowrap bg-card border-0 chase-card-shadow hover:bg-muted/50 rounded-full h-12 px-5 font-medium flex-shrink-0 transition-transform duration-150 active:scale-95"
          onClick={onTransfer}
        >
          <ArrowRightLeft className="h-4 w-4 text-[#0a4fa6]" />
          <span>Transfer</span>
        </Button>
      )}
      <Button
        variant="outline"
        className="flex items-center gap-2 whitespace-nowrap bg-card border-0 chase-card-shadow hover:bg-muted/50 rounded-full h-12 px-5 font-medium flex-shrink-0 transition-transform duration-150 active:scale-95"
        onClick={onDepositChecks}
      >
        <FileText className="h-4 w-4 text-[#0a4fa6]" />
        <span>Deposit</span>
      </Button>
      <Button
        variant="outline"
        className="flex items-center gap-2 whitespace-nowrap bg-card border-0 chase-card-shadow hover:bg-muted/50 rounded-full h-12 px-5 font-medium flex-shrink-0 transition-transform duration-150 active:scale-95"
        onClick={onPayBills}
      >
        <CreditCard className="h-4 w-4 text-[#0a4fa6]" />
        <span>Pay bills</span>
      </Button>
    </div>
  )
}
