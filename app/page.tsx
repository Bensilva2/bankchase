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
import { AddAccountDrawer } from "@/components/add-account-drawer"
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
import { ChaseLogin } from "@/components/chase-login"
import { DisputeTransactionDrawer } from "@/components/dispute-transaction-drawer"
import { useBanking } from "@/lib/banking-context"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"

export default function BankingDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  const [activeView, setActiveView] = useState("accounts")
  const [sendMoneyOpen, setSendMoneyOpen] = useState(false)
  const [depositChecksOpen, setDepositChecksOpen] = useState(false)
  const [payBillsOpen, setPayBillsOpen] = useState(false)
  const [addAccountOpen, setAddAccountOpen] = useState(false)
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
  const { toast } = useToast()

  const { userProfile, addNotification, addActivity, addLoginHistory } = useBanking()

  const getUserFirstName = useCallback(() => {
    if (user?.firstName) return user.firstName
    if (user?.username) return user.username
    return "User"
  }, [user?.firstName, user?.username])

  useEffect(() => {
    if (!user) return

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

    const welcomeTimer = setTimeout(() => {
      toast({
        title: `Welcome back, ${getUserFirstName()}!`,
        description: "Your accounts are up to date.",
        duration: 3000,
      })
    }, 1500)

    return () => {
      clearTimeout(welcomeTimer)
    }
  }, [user, addActivity, addLoginHistory, toast, getUserFirstName])

  const handleLogout = () => {
    if (addActivity) {
      addActivity({
        action: "Signed out",
        device: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser",
        location: "Current Session",
      })
    }
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    setActiveView("accounts")
    toast({
      title: "Signed out successfully",
      description: "You have been securely signed out.",
    })
    router.push("/")
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a4fa6]">
        <div className="flex flex-col items-center gap-4">
          <Image src="/images/chase-logo.png" alt="Chase" width={80} height={80} className="rounded-xl shadow-lg" priority loading="eager" />
          <span className="text-white text-2xl font-bold tracking-wide">CHASE</span>
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <ChaseLogin onLogin={() => {}} />
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
              onAddAccount={() => setAddAccountOpen(true)}
              onTransfer={() => setTransferOpen(true)}
            />
            <AccountsSection
              onViewAccount={() => setAccountDetailsOpen(true)}
              onLinkExternal={() => setLinkExternalOpen(true)}
              onSeeAllTransactions={() => setTransactionsOpen(true)}
              onReceiptOpen={handleOpenReceipt}
            />
            <CreditJourneyCard onViewScore={() => setCreditScoreOpen(true)} />
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

      <main className="px-4 pt-5">
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
      <AddAccountDrawer open={addAccountOpen} onOpenChange={setAddAccountOpen} />
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
    </div>
  )
}
