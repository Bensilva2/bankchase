"use client"

import { Wallet, ArrowLeftRight, PieChart, Tag, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { pageLoader } from "@/lib/page-loader"

interface BottomNavigationProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function BottomNavigation({ activeView, onViewChange }: BottomNavigationProps) {
  const [loadingView, setLoadingView] = useState<string | null>(null)

  const navItems = [
    { id: "accounts", label: "Accounts", icon: Wallet, tooltip: "View all your accounts" },
    { id: "pay-transfer", label: "Pay & Transfer", icon: ArrowLeftRight, tooltip: "Send money & pay bills" },
    { id: "plan-track", label: "Plan & Track", icon: PieChart, tooltip: "Budget & spending insights" },
    { id: "offers", label: "Offers", icon: Tag, tooltip: "Exclusive offers for you" },
    { id: "more", label: "More", icon: Menu, tooltip: "Settings & more options" },
  ]

  const handleViewChange = (viewId: string) => {
    if (activeView === viewId) return
    
    setLoadingView(viewId)
    pageLoader.startLoading(20)
    
    // Simulate view loading delay
    setTimeout(() => {
      onViewChange(viewId)
      pageLoader.completeLoading()
      setLoadingView(null)
    }, 300)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          const isLoading = loadingView === item.id

          return (
            <Button
              key={item.id}
              variant="ghost"
              disabled={isLoading}
              className={cn(
                "flex flex-col items-center gap-0.5 h-auto py-2 px-3 min-w-[64px] rounded-xl transition-all",
                isActive
                  ? "text-primary bg-primary/5 dark:bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10",
                isLoading && "opacity-50",
              )}
              onClick={() => handleViewChange(item.id)}
              title={item.tooltip}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]", isLoading && "animate-spin")} />
              <span className={cn("text-[10px]", isActive && "font-semibold")}>{item.label}</span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
