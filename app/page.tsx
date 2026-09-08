"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { QuickActions } from "@/components/quick-actions"
import { AccountsSection } from "@/components/accounts-section"
import { CreditJourneyCard } from "@/components/credit-journey-card"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SendMoneyDrawer } from "@/components/send-money-drawer"
import { DepositChecksDrawer } from "@/components/deposit-checks-drawer"
import { PayBillsDrawer } from "@/components/pay-bills-drawer"
import { AccountDetailsDrawer } from "@/components/account-details-drawer"
import { LinkExternalDrawer } from "@/components/link-external-drawer"
import { CreditScoreDrawer } from "@/components/credit-score-drawer"
import { PayTransferView } from "@/components/pay-transfer-view"
import { PlanTrackView } from "@/components/plan-track-view"
import { OffersView } from "@/components/offers-view"
import { MoreView } from "@/components/more-view"
import { useToast } from "@/hooks/use-toast"
import { TransferDrawer } from "@/components/transfer-drawer"
import { WireDrawer } from "@/components/wire-drawer"
import { TransactionReceiptModal } from "@/components/transaction-receipt-modal"
import { TransactionsDrawer } from "@/components/transactions-drawer"
import { DisputeTransactionDrawer } from "@/components/dispute-transaction-drawer"
import { useBanking } from "@/lib/banking-context"
import { AccountOpeningModal } from "@/components/account-opening-modal"
import { useAuth } from "@/lib/auth-context"
import { Settings2, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/Navigation"

export default function BankingDashboard() {
  const [activeView, setActiveView] = useState("accounts")
  const [sendMoneyOpen, setSendMoneyOpen] = useState(false)
  const [depositChecksOpen, setDepositChecksOpen] = useState(false)
  const [payBillsOpen, setPayBillsOpen] = useState(false)
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false)
  const [linkExternalOpen, setLinkExternalOpen] = useState(false)
  const [creditScoreOpen, setCreditScoreOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [wireOpen, setWireOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [transactionsOpen, setTransactionsOpen] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeTransactionId, setDisputeTransactionId] = useState<string | null>(null)
  const [accountOpeningOpen, setAccountOpeningOpen] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    try { return JSON.parse(window.localStorage.getItem('banking-dashboard-preferences') || '{}').theme || 'light' } catch { return 'light' }
  })
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    if (typeof window === 'undefined') return 'comfortable'
    try { return JSON.parse(window.localStorage.getItem('banking-dashboard-preferences') || '{}').density || 'comfortable' } catch { return 'comfortable' }
  })
  const [visibleCards, setVisibleCards] = useState({ accounts: true, activity: true, credit: true })
  const { toast } = useToast()

  useEffect(() => {
    window.localStorage.setItem('banking-dashboard-preferences', JSON.stringify({ theme, density, visibleCards }))
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme, density, visibleCards])

  const resetDashboardPreferences = () => {
    setTheme('light')
    setDensity('comfortable')
    setVisibleCards({ accounts: true, activity: true, credit: true })
    toast({ title: 'Dashboard reset', description: 'Your default dashboard layout has been restored.' })
  }

  const { userProfile, addNotification, addActivity, addLoginHistory } = useBanking()
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  const getUserFirstName = useCallback(() => {
    return userProfile.name.split(" ")[0] || "User"
  }, [userProfile.name])

  useEffect(() => {
    if (authLoading || !user) return

    const deviceInfo = navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser"

    if (addActivity) {
      addActivity({
        action: "Signed in successfully",
        device: deviceInfo,
        location: "Current Session",
      })
    }

    if (addLoginHistory) {
      addLoginHistory({
        device: deviceInfo,
        location: "New York, NY",
        status: "success",
        ip: "192.168.1." + Math.floor(Math.random() * 255),
      })
    }

  }, [addActivity, addLoginHistory, authLoading, toast, user])

  const handleLogout = async () => {
    if (addActivity) {
      addActivity({
        action: "Signed out",
        device: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser",
        location: "Current Session",
      })
    }
    setActiveView("accounts")
    toast({
      title: "Signing out",
      description: "Your banking session is being securely closed.",
    })
    await logout()
  }

  const handleOpenReceipt = (transactionId: string) => {
    setSelectedTransactionId(transactionId)
    setReceiptOpen(true)
  }

  const handleOpenDispute = (transactionId: string) => {
    setDisputeTransactionId(transactionId)
    setDisputeOpen(true)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/sign-in')
    }
  }, [authLoading, router, user])

  if (authLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground" role="status">Opening your secure dashboard…</p>
      </main>
    )
  }

  const renderView = () => {
    switch (activeView) {
      case "accounts":
        return (
          <div className="flex flex-col gap-5 pb-24">
            <QuickActions
              onSendMoney={() => setSendMoneyOpen(true)}
              onDepositChecks={() => setDepositChecksOpen(true)}
              onPayBills={() => setPayBillsOpen(true)}
              onAddAccount={() => setAccountOpeningOpen(true)}
              onTransfer={() => setTransferOpen(true)}
            />
            {visibleCards.accounts && <AccountsSection
              onViewAccount={() => setAccountDetailsOpen(true)}
              onLinkExternal={() => setLinkExternalOpen(true)}
              onSeeAllTransactions={() => setTransactionsOpen(true)}
              onReceiptOpen={handleOpenReceipt}
            />}
            {visibleCards.credit && <CreditJourneyCard onViewScore={() => setCreditScoreOpen(true)} />}
          </div>
        )
      case "pay-transfer":
        return (
          <PayTransferView
            onSendMoney={() => setSendMoneyOpen(true)}
            onPayBills={() => setPayBillsOpen(true)}
            onTransfer={() => setTransferOpen(true)}
            onWire={() => setWireOpen(true)}
            onReceiptOpen={handleOpenReceipt}
          />
        )
      case "plan-track":
        return <PlanTrackView />
      case "offers":
        return <OffersView />
      case "more":
        return <MoreView onLogout={handleLogout} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <Navigation />

      <main className="px-4 pt-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Personal banking</p><p className="text-sm text-muted-foreground">Your accounts, cards, and money movement in one place.</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setCustomizeOpen((open) => !open)}><Settings2 data-icon="inline-start" />Customize dashboard</Button></div>
        </div>
        {customizeOpen && <section aria-label="Dashboard customization" className="mb-5 rounded-2xl border bg-card p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold">Customize your account dashboard</h2><p className="text-sm text-muted-foreground">Choose what you see and how it feels.</p></div><Button variant="ghost" size="sm" onClick={resetDashboardPreferences}>Reset defaults</Button></div><div className="mt-4 grid gap-4 sm:grid-cols-3"><div className="flex flex-col gap-2"><span className="text-sm font-medium">Appearance</span><div className="flex gap-2"><Button size="sm" variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}><Sun data-icon="inline-start" />Light</Button><Button size="sm" variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}><Moon data-icon="inline-start" />Dark</Button></div></div><div className="flex flex-col gap-2"><span className="text-sm font-medium">Density</span><div className="flex gap-2"><Button size="sm" variant={density === 'comfortable' ? 'default' : 'outline'} onClick={() => setDensity('comfortable')}>Comfortable</Button><Button size="sm" variant={density === 'compact' ? 'default' : 'outline'} onClick={() => setDensity('compact')}>Compact</Button></div></div><div className="flex flex-col gap-2"><span className="text-sm font-medium">Visible cards</span><div className="flex flex-wrap gap-2">{(['accounts', 'activity', 'credit'] as const).map((card) => <Button key={card} size="sm" variant={visibleCards[card] ? 'default' : 'outline'} onClick={() => setVisibleCards((current) => ({ ...current, [card]: !current[card] }))}>{card === 'accounts' ? 'Accounts' : card === 'activity' ? 'Activity' : 'Credit'}</Button>)}</div></div></div></section>}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {getUserFirstName()}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {renderView()}
      </main>

      <BottomNavigation activeView={activeView} onViewChange={setActiveView} />

      {/* Drawers */}
      <SendMoneyDrawer open={sendMoneyOpen} onOpenChange={setSendMoneyOpen} onReceiptOpen={handleOpenReceipt} />
      <TransferDrawer open={transferOpen} onOpenChange={setTransferOpen} onReceiptOpen={handleOpenReceipt} />
      <WireDrawer open={wireOpen} onOpenChange={setWireOpen} onReceiptOpen={handleOpenReceipt} />
      <DepositChecksDrawer open={depositChecksOpen} onOpenChange={setDepositChecksOpen} />
      <PayBillsDrawer open={payBillsOpen} onOpenChange={setPayBillsOpen} onReceiptOpen={handleOpenReceipt} />
      <AccountDetailsDrawer
        open={accountDetailsOpen}
        onOpenChange={setAccountDetailsOpen}
        onReceiptOpen={handleOpenReceipt}
      />
      <LinkExternalDrawer open={linkExternalOpen} onOpenChange={setLinkExternalOpen} />
      <CreditScoreDrawer open={creditScoreOpen} onOpenChange={setCreditScoreOpen} />
      <TransactionsDrawer
        open={transactionsOpen}
        onOpenChange={setTransactionsOpen}
        onReceiptOpen={handleOpenReceipt}
      />

      {/* Receipt Modal */}
      <TransactionReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transactionId={selectedTransactionId}
        onDisputeOpen={handleOpenDispute}
      />

      {/* Dispute Transaction Drawer */}
      <DisputeTransactionDrawer open={disputeOpen} onOpenChange={setDisputeOpen} transactionId={disputeTransactionId} />

      {/* Account Opening Modal */}
      <AccountOpeningModal isOpen={accountOpeningOpen} onClose={() => setAccountOpeningOpen(false)} />
    </div>
  )
}
