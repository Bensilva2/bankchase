"use client"

import { Wallet, ArrowLeftRight, PieChart, Tag, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function BottomNavigation({ activeView, onViewChange }: BottomNavigationProps) {
  const navItems = [
    { id: "accounts", label: "Accounts", icon: Wallet },
    { id: "pay-transfer", label: "Pay & transfer", icon: ArrowLeftRight },
    { id: "plan-track", label: "Plan & track", icon: PieChart },
    { id: "offers", label: "Offers", icon: Tag },
    { id: "more", label: "More", icon: Menu },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 z-50 pb-[env(safe-area-inset-bottom)] transform-gpu backface-hidden">
      <div className="flex items-center justify-around px-1 py-1 touch-none">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "flex flex-col items-center gap-0.5 h-auto py-2 px-3 min-w-[64px] rounded-xl transition-all",
                isActive
                  ? "text-[#0a4fa6] bg-[#0a4fa6]/5"
                  : "text-muted-foreground hover:text-[#0a4fa6] hover:bg-[#0a4fa6]/5",
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className={cn("text-[10px]", isActive && "font-semibold")}>{item.label}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
