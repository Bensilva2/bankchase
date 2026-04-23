"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useDataLoaderMultiple } from "@/hooks/use-data-loader"
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
import { SavingsGoalsView } from "@/components/savings-goals-view"
import { SpendingAnalysisView } from "@/components/spending-analysis-view"
import { TransferDrawer } from "@/components/transfer-drawer"
import { WireDrawer } from "@/components/wire-drawer"
import { TransactionReceiptModal } from "@/components/transaction-receipt-modal"
import { TransactionsDrawer } from "@/components/transactions-drawer"
import { LoginPage } from "@/components/login-page"
import { DisputeTransactionDrawer } from "@/components/dispute-transaction-drawer"
import { ChaseVirtualAssistant } from "@/components/chase-virtual-assistant"
import { ViewTransition } from "@/components/view-transition"
import { useBanking } from "@/hooks/use-banking"
import Image from "next/image"

type ViewId = "accounts" | "pay-transfer" | "plan-track" | "offers" | "savings-goals" | "spending-analysis" | "more"

// Data loaders for all app options
const loadUserProfile = async () => {
  return { name: "Hudson Lee", email: "hudson@chase.com" }
}

const loadAccounts = async () => {
  return [
    { id: "1", name: "Checking", balance: 5250.25 },
    { id: "2", name: "Savings", balance: 12450.0 },
  ]
}

const loadTransactions = async () => {
  return []
}

const loadNotifications = async () => {
  return []
}

const loadSettings = async () => {
  return { theme: "light", notifications: true }
}

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false)

  const [activeView, setActiveView] = useState<ViewId>("accounts")

  // Pre-load all data on mount
  useDataLoaderMultiple(
    {
      userProfile: loadUserProfile(),
      accounts: loadAccounts(),
      transactions: loadTransactions(),
      notifications: loadNotifications(),
      settings: loadSettings(),
    },
    {
      timeout: 5000,
      retries: 2,
    },
  )

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

  const {
    userProfile,
    addNotification,
    addActivity,
    addLoginHistory,
    appSettings,
    settingsEnforcer,
    isLocked,
    unlockApp,
  } = useBanking()

  const getUserFirstName = useCallback(() => {
    if (!userProfile?.name) return "User"
    const parts = userProfile.name.split(" ")
    return parts[0] || "User"
  }, [userProfile?.name])

  // Authentication check removed - app is now open access

  useEffect(() => {
    if (isLocked && isLoggedIn) {
      console.log("[v0] App is locked, showing unlock screen")
      setShowBiometricPrompt(true)
    }
  }, [isLocked, isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) return

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
  }, [isLoggedIn, addActivity, addLoginHistory, toast, getUserFirstName])

  const handleLogin = () => {
    setIsLoggedIn(true)
    localStorage.setItem("chase_logged_in", "true")
  }

  const handleLogout = () => {
    if (addActivity) {
      addActivity({
        action: "Signed out",
        device: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Browser",
        location: "Current Session",
      })
    }
    setIsLoggedIn(false)
    localStorage.removeItem("chase_logged_in")
    setActiveView("accounts")
    toast({
      title: "Signed out successfully",
      description: "You have been securely signed out.",
    })
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

  const handleUnlock = async () => {
    if (!settingsEnforcer) return

    // Check if biometric is required
    if (appSettings?.biometricLogin) {
      const biometricSuccess = await settingsEnforcer.checkBiometric()
      if (biometricSuccess) {
        unlockApp()
        setShowBiometricPrompt(false)
        toast({
          title: "Unlocked",
          description: "Welcome back!",
        })
      } else {
        toast({
          title: "Authentication Failed",
          description: "Biometric authentication failed",
          variant: "destructive",
        })
      }
    } else {
      unlockApp()
      setShowBiometricPrompt(false)
    }
  }

  // Simple view change - ViewTransition component handles all animation
  const handleViewChange = useCallback((newView: string) => {
    setActiveView(newView as ViewId)
  }, [])

  const textSizeClass = settingsEnforcer?.getTextSizeClass(appSettings?.textSize || "medium") || "text-base"

  useEffect(() => {
    if (appSettings?.highContrast) {
      document.body.classList.add("high-contrast")
    } else {
      document.body.classList.remove("high-contrast")
    }
  }, [appSettings?.highContrast])

  useEffect(() => {
    if (appSettings?.reduceMotion) {
      document.body.classList.add("reduce-motion")
    } else {
      document.body.classList.remove("reduce-motion")
    }
  }, [appSettings?.reduceMotion])

  useEffect(() => {
    if (appSettings?.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [appSettings?.darkMode])

  const renderViewContent = () => {
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
      case "savings-goals":
        return <SavingsGoalsView />
      case "spending-analysis":
        return <SpendingAnalysisView />
      case "more":
        return <MoreView onLogout={handleLogout} />
      default:
        return null
    }
  }

  // Skip loading state - app is now open access
  // if (isCheckingAuth || isPreloading || !isDataReady) {
  //   return (
  //     <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a4fa6]/5 to-white">
  //       <div className="animate-pulse flex flex-col items-center gap-4">
  //         <div className="h-12 w-12 rounded-full bg-[#0a4fa6] animate-spin" />
  //         <p className="text-gray-600 font-medium">
  //           {isCheckingAuth ? "Initializing..." : "Loading your accounts..."}
  //         </p>
  //         <p className="text-xs text-gray-400">Please wait while we prepare everything</p>
  //       </div>
  //     </div>
  //   )
  // }

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLogin} />
  }

  if (showBiometricPrompt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a4fa6] p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 bg-[#0a4fa6] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">App Locked</h2>
          <p className="text-gray-600 mb-6">
            {appSettings?.biometricLogin ? "Use biometric authentication to unlock" : "Tap to unlock your app"}
          </p>
          <button
            onClick={handleUnlock}
            className="w-full bg-[#0a4fa6] text-white py-3 rounded-lg font-semibold hover:bg-[#083d85] transition-colors"
          >
            {appSettings?.biometricLogin ? "Unlock with Biometric" : "Unlock"}
          </button>
          <button
            onClick={handleLogout}
            className="w-full mt-3 text-gray-600 py-2 text-sm hover:text-gray-900 transition-colors"
          >
            Sign out instead
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen min-h-dvh bg-background overflow-x-hidden overscroll-none ${textSizeClass}`}>
      <DashboardHeader />

      <main className="px-4 pt-5 touch-pan-y">
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

        <ViewTransition viewKey={activeView} loadingDuration={300} showSpinner>
          {renderViewContent()}
        </ViewTransition>
      </main>

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

      {/* Chase Virtual Assistant */}
      <ChaseVirtualAssistant />
    </div>
  )
}
