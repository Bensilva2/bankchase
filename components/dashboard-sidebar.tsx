"use client"

import {
  ArrowLeftRight,
  BarChart3,
  CreditCard,
  Gift,
  Home,
  Menu,
  Settings,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

const items = [
  { id: "accounts", label: "Overview", icon: Home },
  { id: "pay-transfer", label: "Pay & transfer", icon: ArrowLeftRight },
  { id: "plan-track", label: "Plan & track", icon: BarChart3 },
  { id: "offers", label: "Benefits", icon: Gift },
  { id: "more", label: "Settings", icon: Settings },
]

export function DashboardSidebar({ activeView, onViewChange }: DashboardSidebarProps) {
  return (
    <aside className="hidden min-h-[calc(100vh-1px)] w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-border px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold tracking-tight">Mercury</p>
          <p className="text-xs text-muted-foreground">Business banking</p>
        </div>
      </div>
      <nav aria-label="Dashboard navigation" className="flex flex-1 flex-col gap-1 p-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
        {items.map((item) => {
          const Icon = item.icon
          const active = activeView === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn("justify-start gap-3 rounded-lg px-3", active && "bg-primary/10 text-primary hover:bg-primary/15")}
              aria-current={active ? "page" : undefined}
              onClick={() => onViewChange(item.id)}
            >
              <Icon data-icon="inline-start" aria-hidden="true" />
              {item.label}
            </Button>
          )
        })}
        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
          <Button variant="ghost" className="justify-start gap-3 rounded-lg px-3" onClick={() => onViewChange("more")}>
            <CreditCard data-icon="inline-start" aria-hidden="true" />
            Cards & controls
          </Button>
          <Button variant="ghost" className="justify-start gap-3 rounded-lg px-3" onClick={() => onViewChange("more")}>
            <Menu data-icon="inline-start" aria-hidden="true" />
            More tools
          </Button>
        </div>
      </nav>
    </aside>
  )
}
