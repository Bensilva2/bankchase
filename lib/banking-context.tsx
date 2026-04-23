"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import {
  saveLocalData,
  getLocalData,
  syncToCloud,
  fetchFromCloud,
  mergeData,
  getLastSyncTime,
  setLastSyncTime,
} from "@/lib/sync-service"
import { SettingsEnforcer } from "./settings-enforcement"
import { getRealTimeSync } from "./real-time-sync"
import { NotificationManager } from "./notification-manager"

export const CUSTOMER_SERVICE_EMAIL = "chase.org_info247@zohomail.com"
export const CUSTOMER_SERVICE_PHONE = "1-800-935-9935"

export const VERIFICATION_CODES = {
  OTP: "330668",
  COT: "92115",
  TAX: "HM36RC",
}

export type Transaction = {
  id: string
  description: string
  amount: number
  date: string
  type: "debit" | "credit"
  category: string
  status: "completed" | "pending" | "failed"
  reference?: string
  fee?: number
  recipientId?: string
  recipientBank?: string
  recipientAccount?: string
  recipientName?: string
  senderName?: string
  accountFrom?: string
  accountTo?: string
  bankName?: string
  routingNumber?: string
  accountId?: string
}

export type Account = {
  id: string
  name: string
  type: string
  balance: number
  availableBalance: number // Added available balance separate from current balance
  accountNumber: string
  routingNumber: string
  interestRate?: number
}

export type UserProfile = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  memberSince: string
  tier: string
  ultimateRewardsPoints: number
  profilePicture: string | null
  dateOfBirth: string
  ssn: string
  preferredLanguage: string
  currency: string
  timezone: string
  avatarUrl?: string // Added for avatar
}

export type SavingsGoal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
  category: string
  icon?: string
}

export type ExternalRecipient = {
  id: string
  name: string
  bankName: string
  routingNumber: string
  accountNumber: string
  accountType: string
  addedDate: string
  nickname?: string
}

export type Payee = {
  id: string
  name: string
  category: string
  accountNumber: string
  autopay: boolean
  nextDueDate?: string
  amount?: number
}

export type ZelleContact = {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  recentAmount?: number
}

export type LinkedDevice = {
  id: string
  name: string
  type: string
  lastActive: string
  location: string
  current: boolean
  browser?: string
  os?: string
  ip?: string
}

export type Notification = {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "alert"
  date: string
  read: boolean
  category: string
  actionUrl?: string
}

export type Message = {
  id: string
  from: string
  subject: string
  preview: string
  content: string
  date: string
  read: boolean
  category: string
  attachments?: string[]
}

export type Offer = {
  id: string
  title: string
  description: string
  discount: string
  expiresAt: string
  category: string
  merchant: string
  activated: boolean
  saved: boolean
  imageUrl?: string
  terms?: string
}

export type CreditCard = {
  id: string
  name: string
  lastFour: string
  expiryDate: string
  balance: number
  creditLimit: number
  minimumPayment: number
  dueDate: string
  rewards: number
  locked: boolean
  internationalEnabled: boolean
  contactlessEnabled: boolean
  spendingLimit: number
}

export type BankInfo = {
  name: string
  routingNumber: string
  state?: string
  region?: string
  type?: string
}

export type RewardRedemption = {
  id: string
  type: "travel" | "cashback" | "giftcard" | "amazon" | "statement"
  pointsUsed: number
  value: number
  date: string
  description: string
  status: "completed" | "pending"
}

export type ScheduledPayment = {
  id: string
  payee: string
  payeeId?: string
  amount: number
  scheduledDate: string
  frequency: "once" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly"
  accountId: string
  category: string
  status: "scheduled" | "processing" | "completed" | "failed" | "cancelled"
  createdAt: string
  nextPaymentDate?: string
  memo?: string
}

export type AppSettings = {
  darkMode: boolean
  language: string
  region: string
  currency: string
  biometricLogin: boolean
  twoFactorAuth: boolean
  pushNotifications: boolean
  emailNotifications: boolean
  smsAlerts: boolean
  transactionAlerts: boolean
  balanceAlerts: boolean
  balanceThreshold: number
  loginAlerts: boolean
  marketingEmails: boolean
  paperlessStatements: boolean
  quickBalanceEnabled: boolean
  roundUpSavings: boolean
  password: string
  pin: string
  lastPasswordChange: string
  lastPinChange: string
  twoFactorMethod: "sms" | "email" | "authenticator"
  twoFactorPhone: string
  twoFactorEmail: string
  twoFactorEnabled?: boolean
  trustedDevices: Array<{
    id: string
    name: string
    type: string
    lastUsed: string
    location: string
    trusted: boolean
  }>
  loginHistory: {
    id: string
    date: string
    device: string
    location: string
    status: string
    ip: string
  }[]
  privacySettings: {
    shareDataWithPartners: boolean
    personalizedAds: boolean
    locationServices: boolean
    analyticsTracking: boolean
    socialMediaConnections: boolean
    creditBureauAccess: boolean
    accountVisibility: "private" | "contacts" | "public"
    showProfilePhoto: boolean
    showOnlineStatus: boolean
  }
  dataPermissions: {
    cameraAccess: boolean
    photoLibrary: boolean
    contacts: boolean
    notifications: boolean
    location: boolean
    microphone: boolean
    faceId: boolean
    touchId: boolean
  }
  securityQuestions?: Array<{
    question: string
    answer: string
  }>
  lastSecurityReview?: string
  sessionTimeout?: number
  autoLockEnabled?: boolean
  backupCodes?: string[]
  textSize?: string
  highContrast?: boolean
  reduceMotion?: boolean
  screenReader?: boolean
  voiceControl?: boolean
}

export type SupportTicket = {
  id: string
  subject: string
  category: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high"
  messages: {
    id: string
    from: "user" | "support"
    content: string
    timestamp: string
  }[]
  createdAt: string
  updatedAt: string
}

export type FAQ = {
  id: string
  question: string
  answer: string
  category: string
  helpful: boolean | null
}

type BankingContextType = {
  // User Profile
  userProfile: UserProfile
  updateUserProfile: (profile: Partial<UserProfile>) => void

  // Accounts
  accounts: Account[]
  transactions: Transaction[]
  externalRecipients: ExternalRecipient[]
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => Transaction
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => void
  addAccount: (account: Omit<Account, "id">) => void
  updateBalance: (accountId: string, amount: number, type?: "credit" | "debit") => void
  calculateSpending: (month: number, year: number) => number
  getSpendingByCategory: (month: number, year: number) => { category: string; amount: number }[]
  transferFunds: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string,
    fee?: number,
  ) => Transaction
  addExternalRecipient: (recipient: Omit<ExternalRecipient, "id" | "addedDate">) => void
  removeExternalRecipient: (recipientId: string) => void
  selectedBank: BankInfo | null
  setSelectedBank: (bank: BankInfo | null) => void
  getAccountById: (accountId: string) => Account | undefined
  getTransactionById: (transactionId: string) => Transaction | undefined
  getTransactionsByRecipient: (recipientId: string) => Transaction[]

  // Payees
  payees: Payee[]
  addPayee: (payee: Omit<Payee, "id">) => void
  removePayee: (payeeId: string) => void
  updatePayee: (payeeId: string, updates: Partial<Payee>) => void

  // Zelle Contacts
  zelleContacts: ZelleContact[]
  addZelleContact: (contact: Omit<ZelleContact, "id">) => void
  removeZelleContact: (contactId: string) => void

  // Savings Goals
  savingsGoals: SavingsGoal[]
  addSavingsGoal: (goal: Omit<SavingsGoal, "id">) => void
  updateSavingsGoal: (goalId: string, amount: number) => void
  deleteSavingsGoal: (goalId: string) => void

  // Linked Devices
  linkedDevices: LinkedDevice[]
  removeDevice: (deviceId: string) => void
  addDevice: (device: Omit<LinkedDevice, "id">) => void
  updateDevice: (deviceId: string, updates: Partial<LinkedDevice>) => void

  // Notifications
  notifications: Notification[]
  markNotificationRead: (notificationId: string) => void
  deleteNotification: (notificationId: string) => void
  clearAllNotifications: () => void
  unreadNotificationCount: number
  addNotification: (notification: Omit<Notification, "id" | "date" | "read">) => void
  markAllNotificationsRead: () => void

  // Messages
  messages: Message[]
  markMessageRead: (messageId: string) => void
  deleteMessage: (messageId: string) => void
  unreadMessageCount: number
  addMessage: (message: Omit<Message, "id" | "date" | "read">) => void

  // Offers
  offers: Offer[]
  activateOffer: (offerId: string) => void
  saveOffer: (offerId: string) => void
  deleteOffer: (offerId: string) => void

  // Credit Cards
  creditCards: CreditCard[]
  toggleCardLock: (cardId: string) => void
  updateCardSettings: (cardId: string, settings: Partial<CreditCard>) => void

  // App Settings
  appSettings: AppSettings
  updateAppSettings: (settings: Partial<AppSettings>) => void

  // Recent Activity
  recentActivity: { id?: string; action: string; date: string; device: string; location: string }[]
  addActivity: (activity: { action: string; device: string; location: string }) => void

  // Reward Redemptions
  rewardRedemptions: RewardRedemption[]
  redeemPoints: (redemption: Omit<RewardRedemption, "id" | "date" | "status">) => void

  // Support Tickets
  supportTickets: SupportTicket[]
  createSupportTicket: (subject: string, category: string, message: string) => SupportTicket
  addTicketMessage: (ticketId: string, message: string) => void
  closeTicket: (ticketId: string) => void

  // FAQs
  faqs: FAQ[]
  markFaqHelpful: (faqId: string, helpful: boolean) => void

  scheduledPayments: ScheduledPayment[]
  addScheduledPayment: (payment: Omit<ScheduledPayment, "id" | "createdAt" | "status">) => ScheduledPayment
  cancelScheduledPayment: (paymentId: string) => void
  updateScheduledPayment: (paymentId: string, updates: Partial<ScheduledPayment>) => void

  // Login History
  addLoginHistory: (entry: Omit<AppSettings["loginHistory"][0], "id" | "date">) => void

  // Persistence & Sync
  saveToStorage: () => void
  loadFromStorage: () => Promise<void> // Changed to async to handle cloud fetch
  isSyncing: boolean
  isOnline: boolean
  lastSynced: string | null
  manualSync: () => Promise<boolean>

  // Data Management
  exportData: () => string
  clearAllData: () => void

  // Add settings enforcer and lock state to context
  settingsEnforcer: SettingsEnforcer | null
  isLocked: boolean
  unlockApp: () => void

  // Expose real-time sync and notification manager
  realTimeSync: ReturnType<typeof getRealTimeSync>
  notificationManager: NotificationManager | null
}

const BankingContext = createContext<BankingContextType | undefined>(undefined)

export { BankingContext }

export function BankingProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add settings enforcer and lock state
  const [settingsEnforcer, setSettingsEnforcer] = useState<SettingsEnforcer | null>(null)
  const [isLocked, setIsLocked] = useState(false)

  const [realTimeSync] = useState(() => getRealTimeSync())
  const [notificationManager, setNotificationManager] = useState<NotificationManager | null>(null)
  const appSettingsRef = useRef<AppSettings>(null!)

  // Define defaultAppSettings here to be used in clearAllData
  const defaultAppSettings: AppSettings = {
    darkMode: false,
    language: "English",
    region: "United States",
    currency: "EUR",
    biometricLogin: true,
    twoFactorAuth: true, // Changed from false to true
    pushNotifications: true,
    emailNotifications: true,
    smsAlerts: true,
    transactionAlerts: true,
    balanceAlerts: true,
    balanceThreshold: 1000, // Changed from 100 to 1000
    loginAlerts: true,
    marketingEmails: false,
    paperlessStatements: true,
    quickBalanceEnabled: true,
    roundUpSavings: false,
    password: "Chun2000",
    pin: "1234",
    lastPasswordChange: "",
    lastPinChange: "",
    twoFactorMethod: "sms",
    twoFactorPhone: "(555) 888-9999", // Updated phone number
    twoFactorEmail: "hungchun164@gmail.com", // Updated email
    twoFactorEnabled: true, // Changed from false to true
    trustedDevices: [
      {
        id: "dev1",
        name: "iPhone 15 Pro Max",
        type: "mobile",
        lastUsed: new Date().toISOString(),
        location: "New York, NY",
        trusted: true,
      },
    ],
    loginHistory: [
      {
        id: "lh1",
        date: new Date().toISOString(),
        device: "iPhone 15 Pro Max",
        location: "New York, NY",
        status: "success",
        ip: "192.168.1.105",
      },
    ],
    privacySettings: {
      shareDataWithPartners: false,
      personalizedAds: false,
      locationServices: true,
      analyticsTracking: true,
      socialMediaConnections: false,
      creditBureauAccess: true,
      accountVisibility: "private",
      showProfilePhoto: true,
      showOnlineStatus: false,
    },
    dataPermissions: {
      cameraAccess: true,
      photoLibrary: true,
      contacts: true, // Changed from false to true
      notifications: true,
      location: true,
      microphone: false,
      faceId: true,
      touchId: true, // Changed from false to true
    },
    securityQuestions: [
      { question: "What was your first pet's name?", answer: "Buddy" },
      { question: "What city were you born in?", answer: "New York" },
      { question: "What is your mother's maiden name?", answer: "Smith" },
    ],
    lastSecurityReview: new Date().toISOString(), // Added lastSecurityReview
    sessionTimeout: 15, // Added sessionTimeout
    autoLockEnabled: true, // Added autoLockEnabled
    backupCodes: ["BACKUP-1234-5678", "BACKUP-8765-4321", "BACKUP-1111-2222"], // Added backupCodes
    textSize: "medium",
    highContrast: false,
    reduceMotion: false,
    screenReader: false,
    voiceControl: false,
  }

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "user1",
    name: "CHUN HUNG",
    email: "hungchun164@gmail.com",
    phone: "+1 (702) 886-4745",
    address: "34B Philadelphia, Pennsylvania PA, USA",
    memberSince: "1988-08-24",
    tier: "Chase Private Client",
    ultimateRewardsPoints: 287450,
    profilePicture: null,
    dateOfBirth: "1961-08-24",
    ssn: "697-03-2642",
    preferredLanguage: "English",
    currency: "USD",
    timezone: "America/New_York",
    avatarUrl: "/professional-headshot.png",
  })

  const defaultAccounts: Account[] = [
    {
      id: "1",
      name: "Total Checking",
      type: "checking",
      balance: 580000,
      availableBalance: 580000,
      accountNumber: "290114795",
      routingNumber: "021000021",
      interestRate: 0.01,
    },
    {
      id: "2",
      name: "Chase Savings",
      type: "savings",
      balance: 0,
      availableBalance: 0,
      accountNumber: "****4521",
      routingNumber: "021000021",
      interestRate: 4.0,
    },
    {
      id: "3",
      name: "Sapphire Reserve",
      type: "credit",
      balance: 0,
      availableBalance: 25000,
      accountNumber: "****8901",
      routingNumber: "",
      interestRate: 21.99,
    },
    {
      id: "4",
      name: "Freedom Unlimited",
      type: "credit",
      balance: 0,
      availableBalance: 10000,
      accountNumber: "****7823",
      routingNumber: "",
      interestRate: 19.99,
    },
  ]

  const [accounts, setAccounts] = useState<Account[]>(defaultAccounts)

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx-alsco-001",
      description: "Wire Transfer Credit - Alsco Berufskleidungs Fabrics Enterprises and Company",
      amount: 580000,
      date: new Date().toISOString(),
      type: "credit",
      category: "Income",
      status: "completed",
      reference: "WIRE-ALSCO-2024-001",
      senderName: "Alsco Berufskleidungs Fabrics Enterprises and Company",
      bankName: "Deutsche Bank AG",
      recipientAccount: "2267003745",
    },
    {
      id: "tx1",
      description: "Payroll Deposit - Tech Corp Inc",
      amount: 8750.0,
      date: new Date().toISOString(),
      type: "credit",
      category: "Income",
      status: "completed",
      reference: "PAY-2024-1201",
    },
    {
      id: "tx2",
      description: "Electric Bill - Con Edison",
      amount: 187.45,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      type: "debit",
      category: "Bills & Utilities",
      status: "completed",
      reference: "UTIL-CE-8821",
    },
    {
      id: "tx3",
      description: "Amazon Purchase",
      amount: 156.99,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      type: "debit",
      category: "Shopping",
      status: "completed",
      reference: "AMZ-11294732",
    },
    {
      id: "tx4",
      description: "Netflix Subscription",
      amount: 22.99,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      type: "debit",
      category: "Entertainment",
      status: "completed",
      reference: "NFLX-MONTHLY",
    },
    {
      id: "tx5",
      description: "Gas Station - Shell",
      amount: 65.42,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      type: "debit",
      category: "Transportation",
      status: "completed",
      reference: "SHELL-89921",
    },
    {
      id: "tx6",
      description: "Grocery Store - Whole Foods",
      amount: 234.87,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      type: "debit",
      category: "Food & Drink",
      status: "completed",
      reference: "WF-442891",
    },
  ])

  const [externalRecipients, setExternalRecipients] = useState<ExternalRecipient[]>([
    {
      id: "ext1",
      name: "John Smith",
      bankName: "Bank of America",
      routingNumber: "026009593",
      accountNumber: "****4567",
      accountType: "Checking",
      addedDate: "2024-06-15",
      nickname: "John",
    },
    {
      id: "ext2",
      name: "Jane Doe",
      bankName: "Wells Fargo",
      routingNumber: "121000248",
      accountNumber: "****8901",
      accountType: "Savings",
      addedDate: "2024-08-20",
      nickname: "Jane",
    },
  ])

  const [selectedBank, setSelectedBank] = useState<BankInfo | null>(null)

  const [payees, setPayees] = useState<Payee[]>([
    {
      id: "payee1",
      name: "Con Edison",
      category: "Utilities",
      accountNumber: "****1234",
      autopay: true,
      nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      amount: 187.45,
    },
    {
      id: "payee2",
      name: "Verizon Wireless",
      category: "Phone",
      accountNumber: "****5678",
      autopay: false,
      nextDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      amount: 89.99,
    },
    {
      id: "payee3",
      name: "State Farm Insurance",
      category: "Insurance",
      accountNumber: "****9012",
      autopay: true,
      nextDueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      amount: 156.0,
    },
  ])

  const [zelleContacts, setZelleContacts] = useState<ZelleContact[]>([
    { id: "z1", name: "Sarah Johnson", email: "sarah.j@email.com", avatar: "", recentAmount: 50 },
    { id: "z2", name: "Mike Chen", phone: "(555) 234-5678", avatar: "", recentAmount: 100 },
    { id: "z3", name: "Emily Davis", email: "emily.d@email.com", avatar: "", recentAmount: 25 },
  ])

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([
    {
      id: "goal1",
      name: "Vacation Fund",
      targetAmount: 5000,
      currentAmount: 2850,
      deadline: "2025-06-01",
      category: "Travel",
    },
    {
      id: "goal2",
      name: "Emergency Fund",
      targetAmount: 10000,
      currentAmount: 7500,
      deadline: "2025-12-31",
      category: "Safety",
    },
    {
      id: "goal3",
      name: "New Car",
      targetAmount: 25000,
      currentAmount: 8200,
      deadline: "2026-01-01",
      category: "Transportation",
    },
  ])

  const [linkedDevices, setLinkedDevices] = useState<LinkedDevice[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chase_linked_devices")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // Fall back to default
        }
      }
    }
    return [
      {
        id: "dev1",
        name: "iPhone 15 Pro Max",
        type: "mobile",
        lastActive: new Date().toISOString(),
        location: "New York, NY",
        current: true,
        browser: "Safari",
        os: "iOS 17.2",
        ip: "192.168.1.105",
      },
      {
        id: "dev2",
        name: 'MacBook Pro 16"',
        type: "desktop",
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        location: "New York, NY",
        current: false,
        browser: "Chrome",
        os: "macOS Sonoma",
        ip: "192.168.1.102",
      },
      {
        id: "dev3",
        name: 'iPad Pro 12.9"',
        type: "tablet",
        lastActive: new Date(Date.now() - 86400000).toISOString(),
        location: "Brooklyn, NY",
        current: false,
        browser: "Safari",
        os: "iPadOS 17.2",
        ip: "192.168.1.110",
      },
    ]
  })

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "notif-alsco-credit",
      title: "Wire Transfer Credit Received",
      message:
        "You have received a wire transfer of $580,000.00 from Alsco Berufskleidungs Fabrics Enterprises and Company (Account: 2267003745). Funds are now available in your Total Checking account.",
      type: "success",
      date: new Date().toISOString(),
      read: false,
      category: "Transactions",
    },
    {
      id: "notif1",
      title: "Direct Deposit Received",
      message: "Your payroll deposit of $8,750.00 has been credited to your Total Checking account.",
      type: "success",
      date: new Date(Date.now() - 60000).toISOString(),
      read: false,
      category: "Transactions",
    },
    {
      id: "notif2",
      title: "Bill Due Soon",
      message: "Your Con Edison bill of $187.45 is due in 7 days.",
      type: "warning",
      date: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      category: "Bills",
    },
    {
      id: "notif3",
      title: "Security Alert",
      message: "New device login detected from MacBook Pro in New York, NY.",
      type: "alert",
      date: new Date(Date.now() - 7200000).toISOString(),
      read: true,
      category: "Security",
    },
    {
      id: "notif4",
      title: "Rewards Points Earned",
      message: "You earned 500 Ultimate Rewards points on your recent purchase.",
      type: "info",
      date: new Date(Date.now() - 86400000).toISOString(),
      read: true,
      category: "Rewards",
    },
    {
      id: "notif5",
      title: "Low Balance Alert",
      message: "Your Savings account balance has fallen below $1,000.",
      type: "warning",
      date: new Date(Date.now() - 7200000).toISOString(),
      read: false,
      category: "Alerts",
    },
    {
      id: "notif6",
      title: "Large Transaction Alert",
      message: "A transaction of $3,500 was made on your credit card ending in 4567.",
      type: "alert",
      date: new Date(Date.now() - 10800000).toISOString(),
      read: false,
      category: "Transactions",
    },
    {
      id: "notif7",
      title: "Payment Successful",
      message: "Your credit card payment of $1,250.00 has been processed successfully.",
      type: "success",
      date: new Date(Date.now() - 14400000).toISOString(),
      read: true,
      category: "Payments",
    },
    {
      id: "notif8",
      title: "Travel Notification Confirmed",
      message: "Your travel notification to Paris, France has been confirmed for Dec 15-25.",
      type: "info",
      date: new Date(Date.now() - 172800000).toISOString(),
      read: true,
      category: "Travel",
    },
  ])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg1",
      from: "Chase Customer Service",
      subject: "Your Monthly Statement is Ready",
      preview: "Your November 2024 statement is now available...",
      content:
        "Dear Valued Customer,\n\nYour November 2024 statement is now available for viewing. Log in to your account to view your complete statement, including all transactions, payments, and rewards earned.\n\nThank you for being a Chase customer.\n\nBest regards,\nChase Customer Service",
      date: new Date().toISOString(),
      read: false,
      category: "Statements",
    },
    {
      id: "msg2",
      from: "Chase Offers",
      subject: "Exclusive 5% Cashback Offer",
      preview: "Earn 5% cash back on dining this month...",
      content:
        "Dear Customer,\n\nFor a limited time, earn 5% cash back on all dining purchases when you use your Chase Freedom card. This offer is valid through December 31, 2024.\n\nActivate your offer in the Chase app or online banking.\n\nHappy holidays!\nChase Offers Team",
      date: new Date(Date.now() - 172800000).toISOString(),
      read: true,
      category: "Offers",
    },
    {
      id: "msg3",
      from: "Chase Security",
      subject: "Action Required: Verify Your Recent Transaction",
      preview: "We detected an unusual transaction on your account...",
      content:
        "Dear Customer,\n\nWe noticed a transaction that appears unusual for your account:\n\nDate: December 14, 2024\nAmount: $3,500.00\nMerchant: Online Electronics Store\n\nIf you recognize this transaction, no action is needed. If you don't recognize it, please contact us immediately at 1-800-935-9935.\n\nYour security is our priority.\n\nChase Security Team",
      date: new Date(Date.now() - 86400000).toISOString(),
      read: false,
      category: "Security",
    },
    {
      id: "msg4",
      from: "Chase Rewards",
      subject: "Redeem Your 50,000 Ultimate Rewards Points",
      preview: "You have 50,000 points available to redeem...",
      content:
        "Dear Customer,\n\nCongratulations! You have earned 50,000 Ultimate Rewards points. Here are some ways you can redeem:\n\n• Travel: Book flights, hotels, and rental cars\n• Cash Back: Redeem as statement credit\n• Gift Cards: Choose from hundreds of retailers\n• Shopping: Use points at Amazon and more\n\nLog in to your account to start redeeming today!\n\nChase Rewards Team",
      date: new Date(Date.now() - 259200000).toISOString(),
      read: false,
      category: "Rewards",
    },
    {
      id: "msg5",
      from: "Chase Mortgage",
      subject: "Your Mortgage Rate Lock Expires Soon",
      preview: "Your locked interest rate expires in 7 days...",
      content:
        "Dear Customer,\n\nThis is a reminder that your mortgage rate lock of 6.25% expires on December 21, 2024.\n\nTo maintain this rate, please complete the following:\n• Submit final income documentation\n• Schedule your home appraisal\n• Review and sign closing documents\n\nContact your loan officer at 1-800-848-9380 if you have questions.\n\nChase Mortgage Team",
      date: new Date(Date.now() - 345600000).toISOString(),
      read: true,
      category: "Mortgage",
    },
    {
      id: "msg6",
      from: "Chase Auto Finance",
      subject: "Your Auto Payment is Due in 3 Days",
      preview: "Payment of $487.50 due on December 17...",
      content:
        "Dear Customer,\n\nThis is a friendly reminder that your auto loan payment is due soon:\n\nAmount Due: $487.50\nDue Date: December 17, 2024\nAccount: Auto Loan ending in 8901\n\nYou can make a payment online, through the Chase app, or by calling 1-800-336-6675.\n\nThank you for your business!\nChase Auto Finance",
      date: new Date(Date.now() - 432000000).toISOString(),
      read: false,
      category: "Loans",
    },
  ])

  const [offers, setOffers] = useState<Offer[]>([
    {
      id: "offer1",
      title: "5% Cash Back on Dining",
      description: "Earn 5% cash back on all dining purchases this month",
      discount: "5%",
      expiresAt: "2024-12-31",
      category: "Dining",
      merchant: "All Restaurants",
      activated: false,
      saved: false,
    },
    {
      id: "offer2",
      title: "10% Off at Amazon",
      description: "Get 10% back on Amazon purchases up to $50",
      discount: "10%",
      expiresAt: "2024-12-25",
      category: "Shopping",
      merchant: "Amazon",
      activated: true,
      saved: true,
    },
  ])

  const [creditCards, setCreditCards] = useState<CreditCard[]>([
    {
      id: "card1",
      name: "Chase Sapphire Reserve",
      lastFour: "8901",
      expiryDate: "08/27",
      balance: 3247.56,
      creditLimit: 25000,
      minimumPayment: 125.0,
      dueDate: "2024-12-25",
      rewards: 45000,
      locked: false,
      internationalEnabled: true,
      contactlessEnabled: true,
      spendingLimit: 5000,
    },
    {
      id: "card2",
      name: "Chase Freedom Unlimited",
      lastFour: "7823",
      expiryDate: "03/26",
      balance: 1520.33,
      creditLimit: 15000,
      minimumPayment: 35.0,
      dueDate: "2024-12-20",
      rewards: 12500,
      locked: false,
      internationalEnabled: false,
      contactlessEnabled: true,
      spendingLimit: 3000,
    },
  ])

  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings)
  appSettingsRef.current = appSettings

  const defaultRecentActivity = [
    {
      id: "act1",
      action: "Login from iPhone 15 Pro Max",
      date: new Date().toISOString(),
      device: "iPhone 15 Pro Max",
      location: "New York, NY",
    },
    {
      id: "act2",
      action: "Transfer: $500.00 to Chase Savings",
      date: new Date(Date.now() - 3600000).toISOString(),
      device: "iPhone 15 Pro Max",
      location: "New York, NY",
    },
    {
      id: "act3",
      action: "Bill Payment: Electric Company - $156.78",
      date: new Date(Date.now() - 7200000).toISOString(),
      device: "iPhone 15 Pro Max",
      location: "New York, NY",
    },
    {
      id: "act4",
      action: "Card locked: Chase Sapphire Reserve",
      date: new Date(Date.now() - 86400000).toISOString(),
      device: 'MacBook Pro 16"',
      location: "New York, NY",
    },
    {
      id: "act5",
      action: "Card unlocked: Chase Sapphire Reserve",
      date: new Date(Date.now() - 82800000).toISOString(),
      device: 'MacBook Pro 16"',
      location: "New York, NY",
    },
    {
      id: "act6",
      action: "Settings Change: Push notifications enabled",
      date: new Date(Date.now() - 172800000).toISOString(),
      device: "iPhone 15 Pro Max",
      location: "New York, NY",
    },
  ]

  const [recentActivity, setRecentActivity] = useState(defaultRecentActivity)

  const [rewardRedemptions, setRewardRedemptions] = useState<RewardRedemption[]>([
    {
      id: "rr1",
      type: "cashback",
      pointsUsed: 10000,
      value: 100,
      date: "2024-11-15",
      description: "Statement Credit",
      status: "completed",
    },
    {
      id: "rr2",
      type: "travel",
      pointsUsed: 50000,
      value: 750,
      date: "2024-10-20",
      description: "Flight to Los Angeles",
      status: "completed",
    },
  ])

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])

  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: "faq1",
      question: "How do I change my password?",
      answer:
        "To change your password, go to More > Security & Privacy > Password. You will need to enter your current password and then your new password twice to confirm.",
      category: "Security",
      helpful: null,
    },
    {
      id: "faq2",
      question: "What is Chase Ultimate Rewards?",
      answer:
        "Chase Ultimate Rewards is a rewards program that allows you to earn points on your purchases. Points can be redeemed for travel, cash back, gift cards, or statement credits.",
      category: "Rewards",
      helpful: null,
    },
    {
      id: "faq3",
      question: "How do I activate a new credit card?",
      answer:
        "To activate a new credit card, you can call the number on the sticker on your card, or log in to your Chase account and go to Card Management to activate online.",
      category: "Credit Cards",
      helpful: null,
    },
    {
      id: "faq4",
      question: "What are wire transfer fees?",
      answer:
        "Domestic wire transfers have a $30 fee, while international wire transfers have a $45 fee. These fees are deducted from your account along with the transfer amount.",
      category: "Transfers",
      helpful: null,
    },
    {
      id: "faq5",
      question: "How do I set up two-factor authentication?",
      answer:
        "Go to More > Security & Privacy > Two-Factor Authentication. Choose your preferred method (SMS, Email, or Authenticator App) and follow the setup instructions.",
      category: "Security",
      helpful: null,
    },
  ])

  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([
    {
      id: "sp1",
      payee: "Con Edison",
      payeeId: "payee1",
      amount: 187.45,
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      frequency: "monthly",
      accountId: "1",
      category: "Utilities",
      status: "scheduled",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      memo: "Monthly electric bill",
    },
    {
      id: "sp2",
      payee: "Verizon Wireless",
      payeeId: "payee2",
      amount: 89.99,
      scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      frequency: "monthly",
      accountId: "1",
      category: "Phone",
      status: "scheduled",
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      nextPaymentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      memo: "Phone bill",
    },
  ])

  useEffect(() => {
    loadFromStorage().then(() => setIsLoaded(true))
  }, [])

  // Supabase real-time sync - fetch user data from database and set up live listeners
  useEffect(() => {
    if (typeof window === "undefined") return

    const userId = localStorage.getItem("chase_user_id")
    if (!userId) return

    let accountsChannel: any = null
    let notificationsChannel: any = null
    let transactionsChannel: any = null

    const fetchSupabaseData = async () => {
      try {
        // Fetch user data from dashboard API
        const response = await fetch('/api/dashboard', {
          headers: { 'x-user-id': userId },
        })

        if (!response.ok) return

        const dashData = await response.json()

        // Update user profile from stored data
        const storedUserData = localStorage.getItem("chase_user_data")
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData)
            if (userData.name && userData.email) {
              setUserProfile(prev => ({
                ...prev,
                id: userData.id || prev.id,
                name: userData.name,
                email: userData.email,
                phone: userData.phone || prev.phone,
              }))
            }
          } catch { /* ignore parse errors */ }
        }

        // Update accounts from Supabase data
        const storedAccounts = localStorage.getItem("chase_user_accounts")
        if (storedAccounts) {
          try {
            const dbAccounts = JSON.parse(storedAccounts)
            if (dbAccounts && dbAccounts.length > 0) {
              const mappedAccounts: Account[] = dbAccounts.map((acc: any) => ({
                id: acc.id,
                name: acc.name || 'Checking Account',
                type: acc.account_type || acc.type || 'checking',
                balance: parseFloat(acc.balance) || 0,
                availableBalance: parseFloat(acc.available_balance || acc.balance) || 0,
                accountNumber: acc.full_account_number || acc.account_number || '****0000',
                routingNumber: acc.routing_number || '021000021',
                interestRate: parseFloat(acc.interest_rate) || 0,
              }))
              setAccounts(mappedAccounts)
            }
          } catch { /* ignore parse errors */ }
        }

        // Update transactions from dashboard
        if (dashData.recentTransactions && dashData.recentTransactions.length > 0) {
          const mappedTx: Transaction[] = dashData.recentTransactions.map((tx: any) => ({
            id: tx.id,
            description: tx.description,
            amount: parseFloat(tx.amount) || 0,
            date: tx.date || new Date().toISOString(),
            type: tx.type === 'credit' || tx.type === 'deposit' ? 'credit' : 'debit',
            category: tx.category || 'General',
            status: tx.status || 'completed',
            reference: tx.reference || '',
          }))
          setTransactions(prev => {
            // Only replace if we have real DB transactions
            if (mappedTx.length > 0) return mappedTx
            return prev
          })
        }

        // Update notifications from dashboard
        if (dashData.notifications && dashData.notifications.recent) {
          const dbNotifs: Notification[] = dashData.notifications.recent.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type || 'info',
            date: n.createdAt || new Date().toISOString(),
            read: n.read || false,
            category: n.category || 'General',
          }))
          if (dbNotifs.length > 0) {
            setNotifications(prev => {
              // Merge: add new DB notifs that don't already exist
              const existingIds = new Set(prev.map(n => n.id))
              const newNotifs = dbNotifs.filter(n => !existingIds.has(n.id))
              return [...newNotifs, ...prev]
            })
          }
        }
      } catch (error) {
        console.error('[v0] Error fetching Supabase data:', error)
      }
    }

    // Fetch initial data
    fetchSupabaseData()

    // Set up real-time Supabase listeners for live updates
    const setupRealtimeListeners = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        if (!supabase) return

        // Listen for account balance changes (admin transfers)
        accountsChannel = supabase
          .channel('user_accounts_changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'accounts',
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              console.log('[v0] Real-time account update:', payload)
              const updated = payload.new
              setAccounts(prev => prev.map(acc => {
                if (acc.id === updated.id) {
                  return {
                    ...acc,
                    balance: parseFloat(updated.balance) || acc.balance,
                    availableBalance: parseFloat(updated.available_balance || updated.balance) || acc.availableBalance,
                  }
                }
                return acc
              }))
            }
          )
          .subscribe()

        // Listen for new notifications (credit/debit alerts)
        notificationsChannel = supabase
          .channel('user_notifications_changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              console.log('[v0] Real-time notification:', payload)
              const newNotif = payload.new
              const notification: Notification = {
                id: newNotif.id,
                title: newNotif.title,
                message: newNotif.message,
                type: (newNotif.type === 'credit' ? 'success' : newNotif.type === 'debit' ? 'alert' : newNotif.type) as any,
                date: newNotif.created_at || new Date().toISOString(),
                read: false,
                category: newNotif.category || 'Transactions',
              }
              setNotifications(prev => [notification, ...prev])

              // Show browser notification if supported
              if ('Notification' in window && window.Notification.permission === 'granted') {
                new window.Notification(newNotif.title, {
                  body: newNotif.message,
                  icon: '/images/chase-logo.png',
                  tag: newNotif.id,
                })
              }
            }
          )
          .subscribe()

        // Listen for new transactions
        transactionsChannel = supabase
          .channel('user_transactions_changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'transactions',
              filter: `user_id=eq.${userId}`,
            },
            (payload: any) => {
              console.log('[v0] Real-time transaction:', payload)
              const newTx = payload.new
              const transaction: Transaction = {
                id: newTx.id,
                description: newTx.description,
                amount: parseFloat(newTx.amount) || 0,
                date: newTx.created_at || new Date().toISOString(),
                type: newTx.type === 'credit' || newTx.type === 'deposit' ? 'credit' : 'debit',
                category: newTx.category || 'General',
                status: newTx.status || 'completed',
                reference: newTx.reference || '',
              }
              setTransactions(prev => [transaction, ...prev])
            }
          )
          .subscribe()
      } catch (error) {
        console.error('[v0] Error setting up realtime:', error)
      }
    }

    setupRealtimeListeners()

    // Request notification permission
    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission()
    }

    return () => {
      // Cleanup channels
      const cleanup = async () => {
        try {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          if (supabase) {
            if (accountsChannel) supabase.removeChannel(accountsChannel)
            if (notificationsChannel) supabase.removeChannel(notificationsChannel)
            if (transactionsChannel) supabase.removeChannel(transactionsChannel)
          }
        } catch { /* ignore cleanup errors */ }
      }
      cleanup()
    }
  }, [isLoaded])

  // Internal function to handle adding notifications to avoid circular dependencies
  const addNotificationInternal = useCallback((notification: Omit<Notification, "id" | "date" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif${Date.now()}`,
      date: new Date().toISOString(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }, [])

  // The 'addNotification' dependency was causing a re-creation of notificationManager, which was problematic.
  // It's better to initialize notificationManager once when settingsEnforcer is available.
  useEffect(() => {
    if (settingsEnforcer) {
      const manager = new NotificationManager(
        (type) => settingsEnforcer.shouldSendNotification(type as any),
        addNotificationInternal, // Use the internal addNotification function
      )

      // Request notification permission on first load
      manager.requestPermission().then((granted) => {
        if (granted) {
          console.log("[v0] Notification permission granted")
        }
      })

      setNotificationManager(manager)

      // Cleanup function to potentially destroy the manager if needed
      return () => {
        // manager.destroy(); // Uncomment if NotificationManager has a destroy method
      }
    }
  }, [settingsEnforcer, addNotificationInternal]) // Depend on addNotificationInternal

  useEffect(() => {
    const enforcer = new SettingsEnforcer(() => appSettingsRef.current)
    setSettingsEnforcer(enforcer)

    return () => {
      enforcer.destroy()
    }
  }, [])

  useEffect(() => {
    if (!settingsEnforcer || typeof window === "undefined") return

    const checkAutoLock = () => {
      if (settingsEnforcer.checkAutoLock()) {
        setIsLocked(true)
        console.log("[v0] App locked due to inactivity")
      }
    }

    const interval = setInterval(checkAutoLock, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [settingsEnforcer])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chase_linked_devices", JSON.stringify(linkedDevices))
    }
  }, [linkedDevices])

  useEffect(() => {
    if (!isLoaded) return
    saveToStorage()
  }, [
    isLoaded,
    userProfile,
    accounts,
    transactions,
    externalRecipients,
    payees,
    zelleContacts,
    savingsGoals,
    linkedDevices,
    notifications,
    messages,
    offers,
    creditCards,
    appSettings,
    recentActivity,
    rewardRedemptions,
    supportTickets,
    faqs,
    scheduledPayments,
  ])

  useEffect(() => {
    const unsubscribe = realTimeSync.subscribe("chase_accounts", (data) => {
      if (data && Array.isArray(data)) setAccounts(data)
    })
    return unsubscribe
  }, [realTimeSync])

  useEffect(() => {
    const unsubscribe = realTimeSync.subscribe("chase_transactions", (data) => {
      if (data && Array.isArray(data)) setTransactions(data)
    })
    return unsubscribe
  }, [realTimeSync])

  useEffect(() => {
    const unsubscribe = realTimeSync.subscribe("chase_settings", (data) => {
      if (data && typeof data === "object") setAppSettings(data)
    })
    return unsubscribe
  }, [realTimeSync])

  // Real-time sync for linked devices
  useEffect(() => {
    const unsubscribe = realTimeSync.subscribe("chase_linked_devices", (data) => {
      if (data && Array.isArray(data)) {
        setLinkedDevices(data)
      }
    })
    return unsubscribe
  }, [realTimeSync])

  // Publish linked devices changes for real-time sync
  useEffect(() => {
    if (isLoaded && linkedDevices && linkedDevices.length > 0) {
      realTimeSync.publish("chase_linked_devices", linkedDevices)
    }
  }, [linkedDevices, isLoaded, realTimeSync])

  const saveToStorage = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const data = {
        userProfile,
        accounts,
        transactions,
        externalRecipients,
        payees,
        zelleContacts,
        savingsGoals,
        linkedDevices,
        notifications,
        messages,
        offers,
        creditCards,
        appSettings,
        recentActivity,
        rewardRedemptions,
        supportTickets,
        faqs,
        scheduledPayments,
        savedAt: new Date().toISOString(),
      }

      // Save to localStorage immediately
      saveLocalData(data)

      // Debounced cloud sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }

      syncTimeoutRef.current = setTimeout(async () => {
        if (navigator.onLine && userProfile.email) {
          setIsSyncing(true)
          const success = await syncToCloud(userProfile.email, data)
          if (success) {
            setLastSynced(new Date().toISOString())
            setLastSyncTime(new Date().toISOString()) // Update last sync time
          }
          setIsSyncing(false)
        }
      }, 2000) // Sync to cloud after 2 seconds of no changes
    } catch (error) {
      // Silently handle errors in production
    }
  }, [
    userProfile,
    accounts,
    transactions,
    externalRecipients,
    payees,
    zelleContacts,
    savingsGoals,
    linkedDevices,
    notifications,
    messages,
    offers,
    creditCards,
    appSettings,
    recentActivity,
    rewardRedemptions,
    supportTickets,
    faqs,
    scheduledPayments,
  ])

  const loadFromStorage = useCallback(async () => {
    if (typeof window === "undefined") return
    try {
      // First load from localStorage for instant availability
      const localData = getLocalData()

      if (localData) {
        if (localData.userProfile) setUserProfile(localData.userProfile)
        if (localData.accounts) setAccounts(localData.accounts)
        if (localData.transactions) setTransactions(localData.transactions)
        if (localData.externalRecipients) setExternalRecipients(localData.externalRecipients)
        if (localData.payees) setPayees(localData.payees)
        if (localData.zelleContacts) setZelleContacts(localData.zelleContacts)
        if (localData.savingsGoals) setSavingsGoals(localData.savingsGoals)
        if (localData.linkedDevices) setLinkedDevices(localData.linkedDevices)
        if (localData.notifications) setNotifications(localData.notifications)
        if (localData.messages) setMessages(localData.messages)
        if (localData.offers) setOffers(localData.offers)
        if (localData.creditCards) setCreditCards(localData.creditCards)
        if (localData.appSettings) setAppSettings(localData.appSettings)
        if (localData.recentActivity) setRecentActivity(localData.recentActivity)
        if (localData.rewardRedemptions) setRewardRedemptions(localData.rewardRedemptions)
        if (localData.supportTickets) setSupportTickets(localData.supportTickets)
        if (localData.faqs) setFaqs(localData.faqs)
        if (localData.scheduledPayments) setScheduledPayments(localData.scheduledPayments)
      }

      // Then try to sync with cloud if online
      const email = localData?.userProfile?.email || "hungchun164@gmail.com" // Fallback email
      if (navigator.onLine) {
        setIsSyncing(true)
        try {
          const cloudData = await fetchFromCloud(email)
          if (cloudData) {
            const mergedData = mergeData(localData, cloudData)
            if (mergedData) {
              // Apply merged data
              if (mergedData.userProfile) setUserProfile(mergedData.userProfile)
              if (mergedData.accounts) setAccounts(mergedData.accounts)
              if (mergedData.transactions) setTransactions(mergedData.transactions)
              if (mergedData.externalRecipients) setExternalRecipients(mergedData.externalRecipients)
              if (mergedData.payees) setPayees(mergedData.payees)
              if (mergedData.zelleContacts) setZelleContacts(mergedData.zelleContacts)
              if (mergedData.savingsGoals) setSavingsGoals(mergedData.savingsGoals)
              if (mergedData.linkedDevices) setLinkedDevices(mergedData.linkedDevices)
              if (mergedData.notifications) setNotifications(mergedData.notifications)
              if (mergedData.messages) setMessages(mergedData.messages)
              if (mergedData.offers) setOffers(mergedData.offers)
              if (mergedData.creditCards) setCreditCards(mergedData.creditCards)
              if (mergedData.appSettings) setAppSettings(mergedData.appSettings)
              if (mergedData.recentActivity) setRecentActivity(mergedData.recentActivity)
              if (mergedData.rewardRedemptions) setRewardRedemptions(mergedData.rewardRedemptions)
              if (mergedData.supportTickets) setSupportTickets(mergedData.supportTickets)
              if (mergedData.faqs) setFaqs(mergedData.faqs)
              if (mergedData.scheduledPayments) setScheduledPayments(mergedData.scheduledPayments)

              // Save merged data locally
              saveLocalData(mergedData)
            }
            setLastSynced(new Date().toISOString())
            setLastSyncTime(new Date().toISOString()) // Update last sync time
          }
        } catch (error) {
          // Silently handle cloud sync errors
        }
        setIsSyncing(false)
      }

      setLastSynced(getLastSyncTime()) // Load last sync time from storage
    } catch (error) {
      // Silently handle errors
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Sync when coming back online
      if (userProfile.email) {
        const data = {
          userProfile,
          accounts,
          transactions,
          externalRecipients,
          payees,
          zelleContacts,
          savingsGoals,
          linkedDevices,
          notifications,
          messages,
          offers,
          creditCards,
          appSettings,
          recentActivity,
          rewardRedemptions,
          supportTickets,
          faqs,
          scheduledPayments,
          savedAt: new Date().toISOString(),
        }
        syncToCloud(userProfile.email, data).then((success) => {
          if (success) {
            setLastSynced(new Date().toISOString())
            setLastSyncTime(new Date().toISOString())
          }
        })
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [
    userProfile,
    accounts,
    transactions,
    externalRecipients,
    payees,
    zelleContacts,
    savingsGoals,
    linkedDevices,
    notifications,
    messages,
    offers,
    creditCards,
    appSettings,
    recentActivity,
    rewardRedemptions,
    supportTickets,
    faqs,
    scheduledPayments,
  ])

  useEffect(() => {
    if (!isLoaded || !isOnline) return

    const syncInterval = setInterval(async () => {
      if (navigator.onLine && userProfile.email) {
        const data = {
          userProfile,
          accounts,
          transactions,
          externalRecipients,
          payees,
          zelleContacts,
          savingsGoals,
          linkedDevices,
          notifications,
          messages,
          offers,
          creditCards,
          appSettings,
          recentActivity,
          rewardRedemptions,
          supportTickets,
          faqs,
          scheduledPayments,
          savedAt: new Date().toISOString(),
        }
        const success = await syncToCloud(userProfile.email, data)
        if (success) {
          setLastSynced(new Date().toISOString())
          setLastSyncTime(new Date().toISOString())
        }
      }
    }, 30000) // Sync every 30 seconds

    return () => clearInterval(syncInterval)
  }, [
    isLoaded,
    isOnline,
    userProfile,
    accounts,
    transactions,
    externalRecipients,
    payees,
    zelleContacts,
    savingsGoals,
    linkedDevices,
    notifications,
    messages,
    offers,
    creditCards,
    appSettings,
    recentActivity,
    rewardRedemptions,
    supportTickets,
    faqs,
    scheduledPayments,
  ])

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...updates }
      // Immediately save to localStorage when profile picture changes
      if (updates.profilePicture !== undefined) {
        setTimeout(() => {
          const currentData = getLocalData() || {}
          saveLocalData({
            ...currentData,
            userProfile: updated,
            savedAt: new Date().toISOString(),
          })
        }, 0)
      }
      return updated
    })
  }, [])

  // Public function to add notifications, which will be used by NotificationManager
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "date" | "read">) => {
      addNotificationInternal(notification)
    },
    [addNotificationInternal],
  )

  const addTransaction = useCallback((transaction: Omit<Transaction, "id" | "date">): Transaction => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx${Date.now()}`,
      date: new Date().toISOString(),
    }
    setTransactions((prev) => [newTransaction, ...prev])
    return newTransaction
  }, [])

  const updateTransaction = useCallback((transactionId: string, updates: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((tx) => (tx.id === transactionId ? { ...tx, ...updates } : tx)))
  }, [])

  const addAccount = useCallback((account: Omit<Account, "id">) => {
    const newAccount: Account = {
      ...account,
      id: `acc${Date.now()}`,
    }
    setAccounts((prev) => [...prev, newAccount])
  }, [])

  const calculateSpending = useCallback(
    (month: number, year: number) => {
      return transactions
        .filter((tx) => {
          const txDate = new Date(tx.date)
          return txDate.getMonth() === month && txDate.getFullYear() === year && tx.type === "debit"
        })
        .reduce((sum, tx) => sum + tx.amount, 0)
    },
    [transactions],
  )

  const getSpendingByCategory = useCallback(
    (month: number, year: number) => {
      const spending: { [key: string]: number } = {}
      transactions
        .filter((tx) => {
          const txDate = new Date(tx.date)
          return txDate.getMonth() === month && txDate.getFullYear() === year && tx.type === "debit"
        })
        .forEach((tx) => {
          spending[tx.category] = (spending[tx.category] || 0) + tx.amount
        })
      return Object.entries(spending).map(([category, amount]) => ({ category, amount }))
    },
    [transactions],
  )

  const updateBalance = useCallback((accountId: string, amount: number, type?: "credit" | "debit") => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          let newBalance = acc.balance
          if (type === "credit") {
            newBalance += amount
          } else if (type === "debit") {
            newBalance -= amount
          } else {
            // If type is not specified, assume it's a direct balance update
            newBalance = amount
          }
          return { ...acc, balance: newBalance }
        }
        return acc
      }),
    )
  }, [])

  const transferFunds = useCallback(
    (fromAccountId: string, toAccountId: string, amount: number, description: string, fee = 0): Transaction => {
      // Deduct from source account
      updateBalance(fromAccountId, amount + fee, "debit")

      // Add to destination account
      updateBalance(toAccountId, amount, "credit")

      const newTransaction: Transaction = {
        id: `tx${Date.now()}`,
        description,
        amount: amount + fee,
        date: new Date().toISOString(),
        type: "debit",
        category: "Transfers",
        status: "completed",
        reference: `TRF-${Date.now()}`,
        fee,
        accountFrom: fromAccountId,
        accountTo: toAccountId,
      }

      setTransactions((prev) => [newTransaction, ...prev])
      return newTransaction
    },
    [updateBalance],
  )

  const addExternalRecipient = useCallback((recipient: Omit<ExternalRecipient, "id" | "addedDate">) => {
    const newRecipient: ExternalRecipient = {
      ...recipient,
      id: `ext${Date.now()}`,
      addedDate: new Date().toISOString(),
    }
    setExternalRecipients((prev) => [...prev, newRecipient])
  }, [])

  const removeExternalRecipient = useCallback((recipientId: string) => {
    setExternalRecipients((prev) => prev.filter((r) => r.id !== recipientId))
  }, [])

  const getAccountById = useCallback(
    (accountId: string) => {
      return accounts.find((acc) => acc.id === accountId)
    },
    [accounts],
  )

  const getTransactionById = useCallback(
    (transactionId: string) => {
      return transactions.find((tx) => tx.id === transactionId)
    },
    [transactions],
  )

  const getTransactionsByRecipient = useCallback(
    (recipientId: string) => {
      return transactions.filter((tx) => tx.recipientId === recipientId)
    },
    [transactions],
  )

  const addPayee = useCallback((payee: Omit<Payee, "id">) => {
    const newPayee: Payee = {
      ...payee,
      id: `payee${Date.now()}`,
    }
    setPayees((prev) => [...prev, newPayee])
  }, [])

  const removePayee = useCallback((payeeId: string) => {
    setPayees((prev) => prev.filter((p) => p.id !== payeeId))
  }, [])

  const updatePayee = useCallback((payeeId: string, updates: Partial<Payee>) => {
    setPayees((prev) => prev.map((p) => (p.id === payeeId ? { ...p, ...updates } : p)))
  }, [])

  const addZelleContact = useCallback((contact: Omit<ZelleContact, "id">) => {
    const newContact: ZelleContact = {
      ...contact,
      id: `zelle${Date.now()}`,
    }
    setZelleContacts((prev) => [...prev, newContact])
  }, [])

  const removeZelleContact = useCallback((contactId: string) => {
    setZelleContacts((prev) => prev.filter((c) => c.id !== contactId))
  }, [])

  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, "id">) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal${Date.now()}`,
    }
    setSavingsGoals((prev) => [...prev, newGoal])
  }, [])

  const updateSavingsGoal = useCallback((goalId: string, amount: number) => {
    setSavingsGoals((prev) =>
      prev.map((goal) => (goal.id === goalId ? { ...goal, currentAmount: goal.currentAmount + amount } : goal)),
    )
  }, [])

  const deleteSavingsGoal = useCallback((goalId: string) => {
    setSavingsGoals((prev) => prev.filter((goal) => goal.id !== goalId))
  }, [])

  const removeDevice = useCallback((deviceId: string) => {
    setLinkedDevices((prev) => prev.filter((device) => device.id !== deviceId))
  }, [])

  const addDevice = useCallback((device: Omit<LinkedDevice, "id">) => {
    const newDevice: LinkedDevice = {
      ...device,
      id: `dev${Date.now()}`,
    }
    setLinkedDevices((prev) => [...prev, newDevice])
  }, [])

  const updateDevice = useCallback((deviceId: string, updates: Partial<LinkedDevice>) => {
    setLinkedDevices((prev) => prev.map((device) => (device.id === deviceId ? { ...device, ...updates } : device)))
  }, [])

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif)))
  }, [])

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadNotificationCount = notifications && Array.isArray(notifications) ? notifications.filter((notif) => !notif.read).length : 0
  
  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }, [])

  const markMessageRead = useCallback((messageId: string) => {
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)))
  }, [])

  const deleteMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }, [])

  const unreadMessageCount = messages && Array.isArray(messages) ? messages.filter((msg) => !msg.read).length : 0
  
  const addMessage = useCallback((message: Omit<Message, "id" | "date" | "read">) => {
    const newMessage: Message = {
      ...message,
      id: `msg${Date.now()}`,
      date: new Date().toISOString(),
      read: false,
    }
    setMessages((prev) => [newMessage, ...prev])
  }, [])

  const activateOffer = useCallback((offerId: string) => {
    setOffers((prev) => prev.map((offer) => (offer.id === offerId ? { ...offer, activated: true } : offer)))
  }, [])

  const saveOffer = useCallback((offerId: string) => {
    setOffers((prev) => prev.map((offer) => (offer.id === offerId ? { ...offer, saved: true } : offer)))
  }, [])

  const deleteOffer = useCallback((offerId: string) => {
    setOffers((prev) => prev.filter((offer) => offer.id !== offerId))
  }, [])

  const toggleCardLock = useCallback((cardId: string) => {
    setCreditCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, locked: !card.locked } : card)))
  }, [])

  const updateCardSettings = useCallback((cardId: string, settings: Partial<CreditCard>) => {
    setCreditCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, ...settings } : card)))
  }, [])

  const updateAppSettings = useCallback((settings: Partial<AppSettings>) => {
    setAppSettings((prev) => ({ ...prev, ...settings }))
  }, [])

  const addActivity = useCallback((activity: { action: string; device: string; location: string }) => {
    const newActivity = {
      id: `act${Date.now()}`,
      ...activity,
      date: new Date().toISOString(),
    }
    setRecentActivity((prev) => [newActivity, ...prev])
  }, [])

  const redeemPoints = useCallback((redemption: Omit<RewardRedemption, "id" | "date" | "status">) => {
    const newRedemption: RewardRedemption = {
      ...redemption,
      id: `rr${Date.now()}`,
      date: new Date().toISOString(),
      status: "completed",
    }
    setRewardRedemptions((prev) => [newRedemption, ...prev])
  }, [])

  const createSupportTicket = useCallback((subject: string, category: string, message: string) => {
    const newMessage: SupportTicket["messages"][0] = {
      id: `msg${Date.now()}`,
      from: "user",
      content: message,
      timestamp: new Date().toISOString(),
    }
    const newTicket: SupportTicket = {
      id: `ticket${Date.now()}`,
      subject,
      category,
      status: "open",
      priority: "medium",
      messages: [newMessage],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setSupportTickets((prev) => [...prev, newTicket])
    return newTicket
  }, [])

  const addTicketMessage = useCallback((ticketId: string, message: string) => {
    setSupportTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              messages: [
                ...ticket.messages,
                {
                  id: `msg${Date.now()}`,
                  from: "user" as const,
                  content: message,
                  timestamp: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : ticket,
      ),
    )
  }, [])

  const closeTicket = useCallback((ticketId: string) => {
    setSupportTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: "closed", updatedAt: new Date().toISOString() } : ticket,
      ),
    )
  }, [])

  const markFaqHelpful = useCallback((faqId: string, helpful: boolean) => {
    setFaqs((prev) => prev.map((faq) => (faq.id === faqId ? { ...faq, helpful: helpful } : faq)))
  }, [])

  const addScheduledPayment = useCallback((payment: Omit<ScheduledPayment, "id" | "createdAt" | "status">) => {
    const newPayment: ScheduledPayment = {
      ...payment,
      id: `sp${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "scheduled",
      nextPaymentDate: payment.scheduledDate, // Initialize nextPaymentDate
    }
    setScheduledPayments((prev) => [...prev, newPayment])
    return newPayment
  }, [])

  const cancelScheduledPayment = useCallback((paymentId: string) => {
    setScheduledPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status: "cancelled" } : p)))
  }, [])

  const updateScheduledPayment = useCallback((paymentId: string, updates: Partial<ScheduledPayment>) => {
    setScheduledPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, ...updates } : p)))
  }, [])

  const addLoginHistory = useCallback((entry: Omit<AppSettings["loginHistory"][0], "id" | "date">) => {
    const newEntry = {
      id: `lh${Date.now()}`,
      ...entry,
      date: new Date().toISOString(),
    }
    setAppSettings((prev) => ({
      ...prev,
      loginHistory: [...prev.loginHistory, newEntry],
    }))
  }, [])

  const manualSync = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !userProfile.email) return false
    setIsSyncing(true)
    const data = {
      userProfile,
      accounts,
      transactions,
      externalRecipients,
      payees,
      zelleContacts,
      savingsGoals,
      linkedDevices,
      notifications,
      messages,
      offers,
      creditCards,
      appSettings,
      recentActivity,
      rewardRedemptions,
      supportTickets,
      faqs,
      scheduledPayments,
      savedAt: new Date().toISOString(),
    }
    const success = await syncToCloud(userProfile.email, data)
    if (success) {
      setLastSynced(new Date().toISOString())
      setLastSyncTime(new Date().toISOString())
    }
    setIsSyncing(false)
    return success
  }, [
    userProfile,
    accounts,
    transactions,
    externalRecipients,
    payees,
    zelleContacts,
    savingsGoals,
    linkedDevices,
    notifications,
    messages,
    offers,
    creditCards,
    appSettings,
    recentActivity,
    rewardRedemptions,
    supportTickets,
    faqs,
    scheduledPayments,
  ])

  const exportData = (): string => {
    if (typeof window === "undefined") return ""
    const data = {
      userProfile,
      accounts,
      transactions,
      externalRecipients,
      payees,
      zelleContacts,
      savingsGoals,
      linkedDevices,
      notifications,
      messages,
      offers,
      creditCards,
      appSettings,
      recentActivity,
      rewardRedemptions,
      supportTickets,
      faqs,
      scheduledPayments,
    }
    return JSON.stringify(data, null, 2)
  }

  const clearAllData = useCallback(() => {
    // Reset all state to initial defaults
    setUserProfile({
      id: "user1",
      name: "CHUN HUNG",
      email: "hungchun164@gmail.com",
      phone: "+1 (702) 886-4745",
      address: "34B Philadelphia, Pennsylvania PA, USA",
      memberSince: "1988-08-24",
      tier: "Chase Private Client",
      ultimateRewardsPoints: 287450,
      profilePicture: null,
      dateOfBirth: "1961-08-24",
      ssn: "697-03-2642",
      preferredLanguage: "English",
      currency: "USD",
      timezone: "America/New_York",
      avatarUrl: "/professional-headshot.png",
    })
    setAccounts(defaultAccounts)
    setTransactions([])
    setExternalRecipients([])
    setPayees([])
    setZelleContacts([])
    setSavingsGoals([])
    setLinkedDevices([])
    setNotifications([])
    setMessages([])
    setOffers([])
    setCreditCards([])
    setAppSettings(defaultAppSettings)
    setRecentActivity([])
    setRewardRedemptions([])
    setSupportTickets([])
    setFaqs([])
    setScheduledPayments([])
    setLastSynced(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("chase_banking_last_sync")
    }

    // Clear local storage
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
  }, [])

  const unlockApp = useCallback(() => {
    setIsLocked(false)
    console.log("[v0] App unlocked")
  }, [])

  return (
    <BankingContext.Provider
      value={{
        userProfile,
        updateUserProfile,
        accounts,
        transactions,
        externalRecipients,
        addTransaction,
        updateTransaction,
        addAccount,
        updateBalance,
        calculateSpending,
        getSpendingByCategory,
        transferFunds,
        addExternalRecipient,
        removeExternalRecipient,
        selectedBank,
        setSelectedBank,
        getAccountById,
        getTransactionById,
        getTransactionsByRecipient,
        payees,
        addPayee,
        removePayee,
        updatePayee,
        zelleContacts,
        addZelleContact,
        removeZelleContact,
        savingsGoals,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        linkedDevices,
        removeDevice,
        addDevice,
        updateDevice,
        notifications,
        markNotificationRead,
        deleteNotification,
        clearAllNotifications,
        unreadNotificationCount,
        addNotification,
        markAllNotificationsRead,
        messages,
        markMessageRead,
        deleteMessage,
        unreadMessageCount,
        addMessage,
        offers,
        activateOffer,
        saveOffer,
        deleteOffer,
        creditCards,
        toggleCardLock,
        updateCardSettings,
        appSettings,
        updateAppSettings,
        recentActivity,
        addActivity,
        rewardRedemptions,
        redeemPoints,
        supportTickets,
        createSupportTicket,
        addTicketMessage,
        closeTicket,
        faqs,
        markFaqHelpful,
        scheduledPayments,
        addScheduledPayment,
        cancelScheduledPayment,
        updateScheduledPayment,
        addLoginHistory,
        isSyncing,
        isOnline,
        lastSynced,
        manualSync,
        saveToStorage,
        loadFromStorage,
        exportData,
        clearAllData,
        // Add settings enforcer and lock state to context
        settingsEnforcer,
        isLocked,
        unlockApp,
        // Expose real-time sync and notification manager
        realTimeSync,
        notificationManager,
      }}
    >
      {children}
    </BankingContext.Provider>
  )
}

export function useBanking() {
  const context = useContext(BankingContext)
  if (context === undefined) {
    throw new Error("useBanking must be used within a BankingProvider")
  }
  return context
}
