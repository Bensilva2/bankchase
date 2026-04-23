"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Wallet, ArrowLeftRight, PieChart, Tag, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  activeView: string
  onViewChange: (view: string) => void
}

const navItems = [
  { id: "accounts", label: "Accounts", icon: Wallet },
  { id: "pay-transfer", label: "Pay & transfer", icon: ArrowLeftRight },
  { id: "plan-track", label: "Plan & track", icon: PieChart },
  { id: "offers", label: "Offers", icon: Tag },
  { id: "more", label: "More", icon: Menu },
] as const

export function BottomNavigation({ activeView, onViewChange }: BottomNavigationProps) {
  const navRef = useRef<HTMLDivElement>(null)
  const buttonsRef = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const [isReady, setIsReady] = useState(false)

  const updateIndicator = useCallback(() => {
    const activeButton = buttonsRef.current.get(activeView)
    if (activeButton && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect()
      const btnRect = activeButton.getBoundingClientRect()
      setIndicatorStyle({
        left: btnRect.left - navRect.left + btnRect.width * 0.15,
        width: btnRect.width * 0.7,
      })
      if (!isReady) setIsReady(true)
    }
  }, [activeView, isReady])

  useEffect(() => {
    updateIndicator()
    window.addEventListener("resize", updateIndicator)
    return () => window.removeEventListener("resize", updateIndicator)
  }, [updateIndicator])

  const setButtonRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) {
      buttonsRef.current.set(id, el)
    }
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 z-50 pb-[env(safe-area-inset-bottom)] transform-gpu backface-hidden">
      <div ref={navRef} className="relative flex items-center justify-around px-1 py-1 touch-none">
        {/* Sliding active indicator */}
        <div
          className={cn(
            "absolute top-0 h-[2.5px] bg-[#0a4fa6] rounded-b-full nav-indicator",
            !isReady && "opacity-0"
          )}
          style={{
            transform: `translateX(${indicatorStyle.left}px)`,
            width: `${indicatorStyle.width}px`,
          }}
        />

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <button
              key={item.id}
              ref={(el) => setButtonRef(item.id, el)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 min-w-[64px] rounded-xl transition-all duration-200 bg-transparent border-0 cursor-pointer",
                isActive
                  ? "text-[#0a4fa6]"
                  : "text-muted-foreground active:text-[#0a4fa6]",
              )}
              onClick={() => onViewChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={cn(
                "transition-transform duration-200",
                isActive && "scale-110"
              )}>
                <Icon className={cn("h-5 w-5 transition-all duration-200", isActive && "stroke-[2.5px]")} />
              </div>
              <span className={cn(
                "text-[10px] transition-all duration-200 leading-tight",
                isActive ? "font-bold" : "font-medium"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
