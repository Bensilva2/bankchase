"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Edit, Camera, User, Mail, Phone, Calendar, Shield, Award, Gift, CreditCard, Smartphone, Bell, HelpCircle, FileText, Settings, LogOut, Send, History, Plane, Euro, DollarSign, Target, Plus, Trash2, CheckCircle, XCircle, Eye, EyeOff, Lock, Unlock, Key, Copy, Download, MapPin, Search, MessageCircle, ArrowLeft, Loader2, RefreshCw, Monitor, Tablet, Globe, Clock, UserCog, ShieldCheck, PieChart, Ticket, Bot, ChevronDown, QrCode, CheckCheck, AlertCircle, AlertTriangle, Info, X, Paperclip, ArrowRightLeft, Receipt, Navigation, Home, Car, TrendingDown, Link2 } from "lucide-react"
import { SavingsGoalsView } from "@/components/savings-goals-view"
import { SpendingAnalysisView } from "@/components/spending-analysis-view"
import { LinkedDevicesManager } from "@/components/linked-devices-manager"
import { AccountSettingsPanel } from "@/components/account-settings-panel"
import { EnhancedAccountSettings } from "@/components/enhanced-account-settings"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { formatDistanceToNow, format } from "date-fns" // Added for date formatting
import { Separator } from "@/components/ui/separator" // Added for message detail view

const detectDeviceInfo = () => {
  const ua = navigator.userAgent
  let deviceName = "Unknown Device"
  let deviceType = "desktop"
  let browser = "Unknown Browser"
  let os = "Unknown OS"

  // Detect OS
  if (ua.includes("Windows NT 10")) os = "Windows 10"
  else if (ua.includes("Windows NT 11") || (ua.includes("Windows NT 10") && ua.includes("Win64"))) os = "Windows 11"
  else if (ua.includes("Mac OS X")) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/)
    os = match ? `macOS ${match[1].replace("_", ".")}` : "macOS"
  } else if (ua.includes("iPhone OS")) {
    const match = ua.match(/iPhone OS (\d+_\d+)/)
    os = match ? `iOS ${match[1].replace("_", ".")}` : "iOS"
  } else if (ua.includes("iPad")) {
    const match = ua.match(/OS (\d+_\d+)/)
    os = match ? `iPadOS ${match[1].replace("_", ".")}` : "iPadOS"
  } else if (ua.includes("Android")) {
    const match = ua.match(/Android (\d+\.?\d*)/)
    os = match ? `Android ${match[1]}` : "Android"
  } else if (ua.includes("Linux")) os = "Linux"

  // Detect Browser
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome"
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"
  else if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("Edg")) browser = "Microsoft Edge"
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera"

  // Detect Device Type and Name
  if (ua.includes("iPhone")) {
    deviceType = "mobile"
    if (ua.includes("iPhone15")) deviceName = "iPhone 15 Pro Max"
    else if (ua.includes("iPhone14")) deviceName = "iPhone 14"
    else deviceName = "iPhone"
  } else if (ua.includes("iPad")) {
    deviceType = "tablet"
    deviceName = "iPad"
  } else if (ua.includes("Android")) {
    if (ua.includes("Mobile")) {
      deviceType = "mobile"
      deviceName = "Android Phone"
    } else {
      deviceType = "tablet"
      deviceName = "Android Tablet"
    }
  } else if (ua.includes("Macintosh")) {
    deviceType = "desktop"
    deviceName = "Mac"
  } else if (ua.includes("Windows")) {
    deviceType = "desktop"
    deviceName = "Windows PC"
  } else {
    deviceType = "desktop"
    deviceName = "Desktop Computer"
  }

  // More specific device naming based on browser
  if (deviceType === "desktop") {
    deviceName = `${deviceName} (${browser})`
  }

  return { deviceName, deviceType, browser, os }
}

const getDeviceLocation = async (): Promise<string> => {
  try {
    const response = await fetch("https://ipapi.co/json/")
    const data = await response.json()
    return `${data.city}, ${data.region_code || data.region}`
  } catch {
    return "Unknown Location"
  }
}

const generateDemoIP = () => {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

const defaultUserProfile = {
  id: "user1",
  name: "Lin Huang",
  email: "linhuang011@gmail.com",
  phone: "(555) 888-9999",
  address: "245 Park Avenue, New York, NY 10167",
  dateOfBirth: "1985-06-15",
  ssn: "***-**-4521",
  memberSince: "March 2018",
  profilePicture: "",
  tier: "Chase Private Client",
  ultimateRewardsPoints: 287450,
  preferredLanguage: "English",
  currency: "USD",
  timezone: "America/New_York",
}

type ViewType =
  | "main"
  | "profile"
  | "editProfile"
  | "settings"
  | "security"
  | "security-password"
  | "security-pin"
  | "security-privacy"
  | "security-data"
  | "security-2fa"
  | "security-devices"
  | "security-history"
  | "notifications"
  | "cards"
  | "help"
  | "rewards"
  | "savings"
  | "spending"
  | "messages"
  | "messageDetail"
  | "notificationCenter"
  | "activity"
  | "redeemPoints"
  | "devices"
  | "loginHistory" // Add devices view type to ViewType union
  | "accountManagement"
  | "changeUsername"
  | "enhancedSettings"
  | "linkExternal"
  | "viewStatements"
  | "closeAccount"

type HelpSubView =
  | "main"
  | "contact"
  | "chat"
  | "tickets"
  | "new-ticket"
  | "ticket-detail"
  | "faqs"
  | "faq-detail"
  | "tutorials"
  | "security-tips"
  | "about"
  | "terms"
  | "privacy"
  | "locations"
  | "schedule-appointment"
  | "topic-account"
  | "topic-transfers"
  | "topic-cards"
  | "topic-rewards"
  | "topic-security"
  | "topic-locations"

interface MoreViewProps {
  onLogout?: () => void
}

const getActivityIcon = (action: string) => {
  const lowerAction = action.toLowerCase()
  if (lowerAction.includes("card unlocked")) return <Unlock className="h-5 w-5 text-green-600" />
  if (lowerAction.includes("card locked")) return <Lock className="h-5 w-5 text-red-600" />
  if (lowerAction.includes("signed out") || lowerAction.includes("logout"))
    return <LogOut className="h-5 w-5 text-orange-600" />
  if (lowerAction.includes("login") || lowerAction.includes("signed in"))
    return <User className="h-5 w-5 text-blue-600" />
  if (lowerAction.includes("transfer")) return <ArrowRightLeft className="h-5 w-5 text-purple-600" />
  if (lowerAction.includes("bill") || lowerAction.includes("payment"))
    return <Receipt className="h-5 w-5 text-green-600" />
  if (lowerAction.includes("settings")) return <Settings className="h-5 w-5 text-gray-600" />
  if (lowerAction.includes("password") || lowerAction.includes("security"))
    return <Shield className="h-5 w-5 text-yellow-600" />
  if (lowerAction.includes("profile")) return <UserCog className="h-5 w-5 text-blue-600" />
  if (lowerAction.includes("redeem") || lowerAction.includes("points"))
    return <Gift className="h-5 w-5 text-pink-600" />
  if (lowerAction.includes("deposit")) return <DollarSign className="h-5 w-5 text-green-600" />
  if (lowerAction.includes("device")) return <Smartphone className="h-5 w-5 text-indigo-600" />
  return <Clock className="h-5 w-5 text-[#0a4fa6]" />
}

const getActivityBgColor = (action: string) => {
  const lowerAction = action.toLowerCase()
  if (lowerAction.includes("card unlocked")) return "bg-green-100 dark:bg-green-900/30"
  if (lowerAction.includes("card locked")) return "bg-red-100 dark:bg-red-900/30"
  if (lowerAction.includes("signed out") || lowerAction.includes("logout")) return "bg-orange-100 dark:bg-orange-900/30"
  if (lowerAction.includes("login") || lowerAction.includes("signed in")) return "bg-blue-100 dark:bg-blue-900/30"
  if (lowerAction.includes("transfer")) return "bg-purple-100 dark:bg-purple-900/30"
  if (lowerAction.includes("bill") || lowerAction.includes("payment")) return "bg-green-100 dark:bg-green-900/30"
  if (lowerAction.includes("settings")) return "bg-gray-100 dark:bg-gray-900/30"
  if (lowerAction.includes("password") || lowerAction.includes("security")) return "bg-yellow-100 dark:bg-yellow-900/30"
  return "bg-[#0a4fa6]/10"
}

export function MoreView({ onLogout }: MoreViewProps) {
  const {
    userProfile,
    updateUserProfile,
    appSettings,
    updateAppSettings,
    linkedDevices,
    removeDevice,
    addDevice, // Added: Function to add a new device
    updateDevice, // Added: Function to update an existing device
    creditCards,
    toggleCardLock,
    updateCardSettings,
    savingsGoals,
    updateSavingsGoal,
    deleteSavingsGoal,
    addSavingsGoal,
    notifications,
    markNotificationRead,
    deleteNotification,
    clearAllNotifications,
    unreadNotificationCount,
    messages,
    markMessageRead,
    deleteMessage,
    unreadMessageCount,
    recentActivity,
    addActivity,
    accounts,
    getSpendingByCategory,
    rewardRedemptions,
    redeemPoints,
    supportTickets,
    createSupportTicket,
    addTicketMessage,
    faqs,
    externalRecipients,
    addExternalRecipient,
    removeExternalRecipient,
    // New imports for login history
    transactions, // Existing import, kept for completeness
    offers, // Existing import, kept for completeness
    activateOffer, // Existing import, kept for completeness
    closeTicket, // Existing import, kept for completeness
    markFaqHelpful, // Existing import, kept for completeness
    markAllNotificationsRead, // Added for notification center
    clearAllNotifications: clearAllNotificationsAction, // Renamed to avoid conflict
  } = useBanking()

  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentView, setCurrentViewDirect] = useState<ViewType>("main")
  const [isViewLoading, setIsViewLoading] = useState(false)
  const [viewAnimClass, setViewAnimClass] = useState("")
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentViewRef = useRef<ViewType>("main")

  // Keep ref in sync
  useEffect(() => {
    currentViewRef.current = currentView
  }, [currentView])

  // Smooth view transition handler with loading state
  const setCurrentView = useCallback((newView: ViewType) => {
    const current = currentViewRef.current
    if (newView === current) return

    // Clean up previous timers
    if (viewTimerRef.current) clearTimeout(viewTimerRef.current)

    const isBackToMain = newView === "main"
    const isSubToSub = current !== "main" && newView !== "main"

    if (isBackToMain) {
      // Going back to main - slide out then swap
      setViewAnimClass("more-view-exit")
      viewTimerRef.current = setTimeout(() => {
        setCurrentViewDirect("main")
        setViewAnimClass("")
        setIsViewLoading(false)
      }, 180)
    } else if (isSubToSub) {
      // Sub to sub - quick cross-slide
      setViewAnimClass("more-view-exit")
      viewTimerRef.current = setTimeout(() => {
        setCurrentViewDirect(newView)
        setViewAnimClass("more-view-enter")
        viewTimerRef.current = setTimeout(() => {
          setViewAnimClass("")
        }, 320)
      }, 140)
    } else {
      // Main to sub - show loading then slide in
      setIsViewLoading(true)
      setViewAnimClass("")

      viewTimerRef.current = setTimeout(() => {
        setCurrentViewDirect(newView)
        setIsViewLoading(false)
        setViewAnimClass("more-view-enter")

        viewTimerRef.current = setTimeout(() => {
          setViewAnimClass("")
        }, 320)
      }, 280)
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current)
    }
  }, [])

  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null)
  const [selectedNotificationCategory, setSelectedNotificationCategory] = useState<string>("all") // Added for notification center
  const [selectedMessageCategory, setSelectedMessageCategory] = useState<string>("all") // Added for messages view

  const safeUserProfile = userProfile || defaultUserProfile
  const safeRecentActivity = recentActivity || [] // Safe recentActivity
  const safeCreditCards = creditCards || [] // Safe creditCards
  const safeLinkedDevices = linkedDevices || [] // Safe linked devices

  const [editForm, setEditForm] = useState({ ...safeUserProfile })
  // Add password and pin related states
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" })
  const [pinForm, setPinForm] = useState({ current: "", new: "", confirm: "" })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false) // Add state for confirm password visibility
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)
  const [showCurrentPin, setShowCurrentPin] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)

  const [newGoalOpen, setNewGoalOpen] = useState(false)
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", deadline: "", category: "General" })
  const [redeemAmount, setRedeemAmount] = useState("")
  const [redeemType, setRedeemType] = useState<"cashback" | "travel" | "giftcard" | "statement">("cashback")

  // Removed showPassword, showCurrentPassword, showNewPassword states as they are now managed with more specific states
  // const [showPassword, setShowPassword] = useState(false)

  const [twoFactorSetup, setTwoFactorSetup] = useState({ method: appSettings?.twoFactorMethod || "sms", code: "" })

  const [twoFactorStep, setTwoFactorStep] = useState<"method" | "verify" | "backup" | "complete">("method")
  const [twoFactorOTP, setTwoFactorOTP] = useState("")
  const [twoFactorError, setTwoFactorError] = useState("")
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  const [helpSubView, setHelpSubView] = useState<HelpSubView>("main")
  const [selectedFaq, setSelectedFaq] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<{ from: "user" | "bot"; content: string; time: string }[]>([
    {
      from: "bot",
      content: "Hello! I'm Chase Virtual Assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [chatInput, setChatInput] = useState("")
  const [newTicketSubject, setNewTicketSubject] = useState("")
  const [newTicketCategory, setNewTicketCategory] = useState("general")
  const [newTicketMessage, setNewTicketMessage] = useState("")
  const [ticketReply, setTicketReply] = useState("")

  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [appointmentType, setAppointmentType] = useState("general")

  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [cardSettingsOpen, setCardSettingsOpen] = useState(false)

  const [locationSearch, setLocationSearch] = useState("")
  const [searchedLocations, setSearchedLocations] = useState<any[]>([])

  const [newUsername, setNewUsername] = useState("")
  const [closeAccountReason, setCloseAccountReason] = useState("")
  const [closeAccountConfirm, setCloseAccountConfirm] = useState(false)
  const [linkAccountForm, setLinkAccountForm] = useState({
    bankName: "",
    routingNumber: "",
    accountNumber: "",
    accountType: "checking",
    nickname: "",
  })

  const [loginHistory] = useState([
    {
      id: "1",
      date: new Date().toISOString(),
      device: "iPhone 15 Pro",
      location: "New York, NY",
      status: "success" as const,
      ip: "192.168.1.1",
    },
    {
      id: "2",
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      device: "MacBook Pro",
      location: "New York, NY",
      status: "success" as const,
      ip: "192.168.1.2",
    },
    {
      id: "3",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      device: "Windows PC",
      location: "Brooklyn, NY",
      status: "success" as const,
      ip: "192.168.1.3",
    },
    {
      id: "4",
      date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      device: "Unknown Device",
      location: "Los Angeles, CA",
      status: "blocked" as const,
      ip: "45.33.21.98",
    },
    {
      id: "5",
      date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      device: "iPad Pro",
      location: "New York, NY",
      status: "success" as const,
      ip: "192.168.1.1",
    },
  ])

  useEffect(() => {
    const registerCurrentDevice = async () => {
      const { deviceName, deviceType, browser, os } = detectDeviceInfo()
      const location = await getDeviceLocation()
      const currentDeviceId = localStorage.getItem("chase_device_id")

      if (!currentDeviceId) {
        // Register new device
        const newDeviceId = `dev_${Date.now()}`
        localStorage.setItem("chase_device_id", newDeviceId)

        // Check if this device already exists in linked devices
        const existingDevice = linkedDevices?.find((d) => d.browser === browser && d.os === os)
        if (!existingDevice && addDevice) {
          addDevice({
            id: newDeviceId, // Assign a unique ID
            name: deviceName,
            type: deviceType,
            lastActive: new Date().toISOString(),
            location: location || "Unknown Location",
            current: true,
            browser,
            os,
            ip: generateDemoIP(),
          })
        }
      } else {
        // Update current device status
        const deviceToUpdate = linkedDevices?.find((d) => d.id === currentDeviceId)
        if (deviceToUpdate && updateDevice) {
          updateDevice(currentDeviceId, {
            current: true,
            lastActive: new Date().toISOString(),
            location: location || deviceToUpdate.location,
          })
        }

        // Ensure other devices are marked as not current
        linkedDevices?.forEach((device) => {
          if (device.id !== currentDeviceId && device.current) {
            updateDevice?.(device.id, { current: false })
          }
        })
      }
    }

    registerCurrentDevice()
  }, [linkedDevices, addDevice, updateDevice]) // Added dependencies

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const spendingData = getSpendingByCategory ? getSpendingByCategory(currentMonth, currentYear) : []
  const totalSpending = spendingData.reduce((acc, item) => acc + item.amount, 0)

  const categoryColors: Record<string, string> = {
    "Food & Drink": "bg-orange-500",
    "Bills & Utilities": "bg-blue-500",
    Shopping: "bg-purple-500",
    Entertainment: "bg-pink-500",
    Transportation: "bg-green-500",
    Transfers: "bg-gray-500",
    Income: "bg-emerald-500",
    Savings: "bg-cyan-500",
  }

  const goalIcons: Record<string, React.ReactNode> = {
    Travel: <Plane className="h-5 w-5" />,
    Transportation: <Car className="h-5 w-5" />,
    Home: <Home className="h-5 w-5" />,
    Safety: <ShieldCheck className="h-5 w-5" />,
    General: <Target className="h-5 w-5" />,
    Education: <FileText className="h-5 w-5" />,
  }

  const handleLogout = () => {
    localStorage.removeItem("chase_logged_in")
    localStorage.removeItem("chase_username")
    localStorage.removeItem("chase_device_id") // Remove device ID on logout

    toast({
      title: "Signed Out",
      description: "You have been successfully signed out of Chase.",
    })

    addActivity({
      action: "Signed out",
      device: detectDeviceInfo().deviceName, // Use detected device info
      location: "Current Location", // Simplified location
    })

    if (onLogout) {
      setTimeout(() => {
        onLogout()
      }, 500)
    }
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64Image = reader.result as string

        // Compress image for localStorage persistence across devices
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const maxSize = 400
          let width = img.width
          let height = img.height

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          ctx?.drawImage(img, 0, 0, width, height)

          const compressedImage = canvas.toDataURL("image/jpeg", 0.8)
          updateUserProfile({ profilePicture: compressedImage })

          toast({
            title: "Profile Picture Updated",
            description: "Your new profile picture has been saved and synced across devices.",
          })
          addActivity({
            action: "Profile picture updated",
            device: detectDeviceInfo().deviceName,
            location: "Current Location",
          })
        }
        img.onerror = () => {
          // If compression fails, use original
          updateUserProfile({ profilePicture: base64Image })
          toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved." })
          addActivity({
            action: "Profile picture updated",
            device: detectDeviceInfo().deviceName,
            location: "Current Location",
          })
        }
        img.src = base64Image
      }
      reader.readAsDataURL(file)
    }
  }

  const handleToggle = (setting: string, value: boolean) => {
    toast({ title: `${setting} ${value ? "Enabled" : "Disabled"}`, description: "Your preference has been saved." })
    addActivity({
      action: `Settings Change: ${setting} ${value ? "enabled" : "disabled"}`,
      device: detectDeviceInfo().deviceName,
      location: "Current Location",
    })
  }

  const handleRedeemPoints = () => {
    const points = Number.parseInt(redeemAmount)
    if (!points || points <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid points amount",
        variant: "destructive",
      })
      return
    }

    if (points > safeUserProfile.ultimateRewardsPoints) {
      toast({
        title: "Insufficient Points",
        description: "You don't have enough points for this redemption",
        variant: "destructive",
      })
      return
    }

    const value = points * (redeemType === "travel" ? 0.0125 : 0.01)
    const descriptions = {
      travel: "Travel Credit",
      cashback: "Cash Back",
      giftcard: "Gift Card",
      statement: "Statement Credit",
    }

    updateUserProfile({
      ultimateRewardsPoints: safeUserProfile.ultimateRewardsPoints - points,
    })

    redeemPoints({
      pointsUsed: points,
      value: value,
      type: redeemType,
      description: descriptions[redeemType],
    })

    addActivity({
      action: `Redeemed ${points.toLocaleString()} points for $${value.toFixed(2)} ${descriptions[redeemType]}`, // Changed currency symbol
      device: detectDeviceInfo().deviceName,
      location: "Current Location",
    })

    toast({
      title: "Points Redeemed!",
      description: `${points.toLocaleString()} points redeemed for $${value.toFixed(2)}`, // Changed currency symbol
    })
    setRedeemAmount("")
    setCurrentView("rewards")
  }

  const handleCardLockToggle = (card: any) => {
    toggleCardLock(card.id)
    const action = card.locked ? `Card unlocked: ${card.name}` : `Card locked: ${card.name}`
    addActivity({
      action,
      device: detectDeviceInfo().deviceName,
      location: "Current Location",
    })
    toast({
      title: card.locked ? "Card Unlocked" : "Card Locked",
      description: `${card.name} has been ${card.locked ? "unlocked" : "locked"}.`,
    })
  }

  const handleUsernameChange = () => {
    if (!newUsername.trim() || newUsername.length < 4) {
      toast({
        title: "Invalid Username",
        description: "Username must be at least 4 characters.",
        variant: "destructive",
      })
      return
    }
    updateUserProfile({ name: newUsername })
    addActivity({
      action: "Username changed",
      device: detectDeviceInfo().deviceName,
      location: "Current Location",
    })
    toast({ title: "Username Updated", description: "Your username has been changed successfully." })
    setNewUsername("")
    setCurrentView("accountManagement")
  }

  const handleLinkExternalAccount = () => {
    if (!linkAccountForm.bankName || !linkAccountForm.routingNumber || !linkAccountForm.accountNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }
    addExternalRecipient({
      id: `external_${Date.now()}`, // Added unique ID
      name: linkAccountForm.nickname || linkAccountForm.bankName,
      bankName: linkAccountForm.bankName,
      routingNumber: linkAccountForm.routingNumber,
      accountNumber: linkAccountForm.accountNumber,
      accountType: linkAccountForm.accountType,
    })
    addActivity({
      action: `Linked external account: ${linkAccountForm.bankName}`,
      device: detectDeviceInfo().deviceName,
      location: "Current Location",
    })
    toast({ title: "Account Linked", description: "External account has been linked successfully." })
    setLinkAccountForm({ bankName: "", routingNumber: "", accountNumber: "", accountType: "checking", nickname: "" })
    setCurrentView("accountManagement")
  }

  const searchLocations = () => {
    if (!locationSearch.trim()) return
    setSearchedLocations([
      {
        id: "1",
        name: "Chase Bank - Main Street",
        type: "Branch",
        address: "123 Main St, New York, NY 10001",
        distance: "0.3 mi",
        hours: "9AM - 5PM",
      },
      {
        id: "2",
        name: "Chase ATM - Broadway",
        type: "ATM",
        address: "456 Broadway, New York, NY 10002",
        distance: "0.5 mi",
        hours: "24/7",
      },
      {
        id: "3",
        name: "Chase Bank - Financial District",
        type: "Branch",
        address: "789 Wall St, New York, NY 10003",
        distance: "0.8 mi",
        hours: "9AM - 6PM",
      },
    ])
  }

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    const userMessage = {
      from: "user" as const,
      content: chatInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setChatMessages([...chatMessages, userMessage])

    const lowerInput = chatInput.toLowerCase()
    let botResponse = "I'm here to help! Could you please provide more details about your question?"

    if (lowerInput.includes("balance") || lowerInput.includes("money") || lowerInput.includes("how much")) {
      const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      botResponse = `Your total balance across all accounts is $${totalBalance.toLocaleString()}. Would you like to see individual account balances?` // Changed currency symbol
    } else if (lowerInput.includes("transfer")) {
      botResponse =
        "You can transfer money by going to Pay & Transfer > Transfer. You can transfer between your accounts or to external accounts instantly."
    } else if (lowerInput.includes("card") || lowerInput.includes("lock")) {
      botResponse =
        "To manage your cards, go to Card Management from the More menu. You can lock/unlock cards, set spending limits, and more."
    } else if (lowerInput.includes("points") || lowerInput.includes("rewards")) {
      botResponse = `You have ${safeUserProfile.ultimateRewardsPoints.toLocaleString()} Ultimate Rewards points. That's worth up to $${(safeUserProfile.ultimateRewardsPoints * 0.0125).toFixed(2)} in travel!` // Changed currency symbol
    } else if (lowerInput.includes("human") || lowerInput.includes("agent") || lowerInput.includes("representative")) {
      botResponse =
        "I'll connect you with a customer service representative. Please call 1-800-935-9935 or email chase.org_info247@zohomail.com for immediate assistance."
    }

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          from: "bot",
          content: botResponse,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    }, 1000)

    setChatInput("")
  }

  const createTicket = () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in subject and message.",
        variant: "destructive",
      })
      return
    }
    createSupportTicket(newTicketSubject, newTicketCategory, newTicketMessage)
    addActivity({
      action: "Created support ticket",
      device: detectDeviceInfo().deviceName,
      location: "Current Location",
    })
    toast({ title: "Ticket Created", description: "Your support ticket has been submitted." })
    setNewTicketSubject("")
    setNewTicketCategory("general")
    setNewTicketMessage("")
    setHelpSubView("tickets")
  }

  const addReplyToTicket = (ticketId: string) => {
    if (!ticketReply.trim()) return
    addTicketMessage(ticketId, ticketReply)
    setTicketReply("")
    toast({ title: "Reply Sent", description: "Your reply has been added to the ticket." })
  }

  const menuItems = [
    { label: "Profile", description: "View and edit your personal details", icon: User, view: "profile" as ViewType },
    {
      label: "Account Management",
      description: "Manage your account settings",
      icon: UserCog,
      view: "accountManagement" as ViewType,
    },
    {
      label: "Notifications",
      description: "Check your latest alerts",
      icon: Bell,
      view: "notificationCenter" as ViewType,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount.toString() : undefined,
    },
    {
      label: "Messages",
      description: "View communications from Chase",
      icon: Mail,
      view: "messages" as ViewType,
      badge: unreadMessageCount > 0 ? unreadMessageCount.toString() : undefined,
    },
    {
      label: "Card Management",
      description: "Manage your credit and debit cards",
      icon: CreditCard,
      view: "cards" as ViewType,
    },
    {
      label: "Chase Ultimate Rewards",
      description: "View and redeem your reward points",
      icon: Award,
      view: "rewards" as ViewType,
    },
    { label: "Savings Goals", description: "Track your financial goals", icon: Target, view: "savings" as ViewType },
    {
      label: "Spending Analysis",
      description: "See where your money is going",
      icon: PieChart,
      view: "spending" as ViewType,
    },
    { label: "Settings", description: "Customize your app preferences", icon: Settings, view: "enhancedSettings" as ViewType },
    {
      label: "Security & Privacy",
      description: "Manage your account security",
      icon: Shield,
      view: "security" as ViewType,
    },
    {
      label: "Help & Support",
      description: "Get assistance and find answers",
      icon: HelpCircle,
      view: "help" as ViewType,
    },
    { label: "Recent Activity", description: "View your activity log", icon: History, view: "activity" as ViewType },
    { label: "Linked Devices", description: "Manage logged-in devices", icon: Smartphone, view: "devices" as ViewType },
  ]

  // Loading overlay for sub-view transitions
  if (isViewLoading) {
    return (
      <div className="pb-24 touch-pan-y overscroll-contain">
        <div className="flex flex-col items-center justify-center min-h-[40dvh] vt-loading-enter">
          <div className="chase-spinner" />
          <p className="text-xs text-muted-foreground mt-3 font-medium tracking-wide">Loading...</p>
        </div>
      </div>
    )
  }

  // Main Menu View
  if (currentView === "main") {
    return (
      <div className="pb-24 touch-pan-y overscroll-contain">
        <Card className="p-4 mb-4 chase-card-shadow option-press cursor-pointer" onClick={() => setCurrentView("profile")}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#0a4fa6] to-[#117aca] flex items-center justify-center overflow-hidden">
                {safeUserProfile.profilePicture ? (
                  <img
                    src={safeUserProfile.profilePicture || "/placeholder.svg"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {(safeUserProfile.name || "U")
                      .split(" ")
                      .map((n) => n[0] || "")
                      .join("")}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                className="absolute -bottom-1 -right-1 h-6 w-6 bg-white rounded-full shadow-md flex items-center justify-center border"
              >
                <Camera className="h-3 w-3 text-gray-600" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureChange}
              />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{safeUserProfile.name || "Chase User"}</h2>
              <p className="text-sm text-muted-foreground">{safeUserProfile.email}</p>
              <Badge variant="secondary" className="mt-1 bg-[#0a4fa6]/10 text-[#0a4fa6]">
                {safeUserProfile.tier || "Member"}
              </Badge>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <div className="space-y-2">
          {menuItems.map((item) => (
            <Card
              key={item.label}
              className="p-4 cursor-pointer hover:bg-accent transition-all duration-150 chase-card-shadow option-press"
              onClick={() => setCurrentView(item.view)}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-[#0a4fa6]/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-[#0a4fa6]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge className="bg-red-500 text-white text-xs h-5 min-w-5 flex items-center justify-center">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          ))}

          <Card
            className="p-4 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150 chase-card-shadow mt-4 option-press"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-red-600">Sign Out</span>
                <p className="text-sm text-muted-foreground">Sign out of your Chase account</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Chase Mobile® App</p>
          <p>Version 5.67.0</p>
        </div>
      </div>
    )
  }

  if (currentView === "activity") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Recent Activity</h2>
        </div>

        <Card className="p-4">
          <div className="space-y-4">
            {safeRecentActivity.length > 0 ? (
              safeRecentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityBgColor(activity.action)}`}
                  >
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Smartphone className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{activity.device}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{activity.location}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {new Date(activity.date).toLocaleDateString()}
                    <br />
                    {new Date(activity.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  if (currentView === "accountManagement") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Account Management</h2>
        </div>

        <Card className="p-4 space-y-1">
          {[
            { label: "Update Personal Information", icon: User, view: "editProfile" as ViewType },
            { label: "Change Username", icon: Edit, view: "changeUsername" as ViewType },
            { label: "Link External Accounts", icon: Link2, view: "linkExternal" as ViewType },
            { label: "View Account Statements", icon: FileText, view: "viewStatements" as ViewType },
            { label: "Close Account", icon: XCircle, view: "closeAccount" as ViewType },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer"
              onClick={() => setCurrentView(item.view)}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">{item.label}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          ))}
        </Card>

        {/* Linked External Accounts */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-[#0a4fa6]">Linked External Accounts</h3>
          {externalRecipients && externalRecipients.length > 0 ? (
            <div className="space-y-3">
              {externalRecipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#0a4fa6]/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-[#0a4fa6]" />
                    </div>
                    <div>
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {recipient.bankName} ••••{recipient.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => {
                      removeExternalRecipient(recipient.id)
                      toast({ title: "Account Removed", description: "External account has been unlinked." })
                      addActivity({
                        action: `Unlinked external account: ${recipient.bankName}`,
                        device: detectDeviceInfo().deviceName,
                        location: "Current Location",
                      })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No external accounts linked yet.</p>
          )}
        </Card>
      </div>
    )
  }

  if (currentView === "changeUsername") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("accountManagement")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Change Username</h2>
        </div>

        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Current Username</Label>
            <Input value={safeUserProfile.name} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>New Username</Label>
            <Input
              placeholder="Enter new username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Username must be at least 4 characters.</p>
          </div>
          <Button className="w-full bg-[#0a4fa6] hover:bg-[#083d80]" onClick={handleUsernameChange}>
            Update Username
          </Button>
        </Card>
      </div>
    )
  }

  if (currentView === "linkExternal") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("accountManagement")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Link External Account</h2>
        </div>

        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Bank Name *</Label>
            <Input
              placeholder="e.g., Bank of America"
              value={linkAccountForm.bankName}
              onChange={(e) => setLinkAccountForm({ ...linkAccountForm, bankName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Routing Number *</Label>
            <Input
              placeholder="9-digit routing number"
              value={linkAccountForm.routingNumber}
              onChange={(e) => setLinkAccountForm({ ...linkAccountForm, routingNumber: e.target.value })}
              maxLength={9}
            />
          </div>
          <div className="space-y-2">
            <Label>Account Number *</Label>
            <Input
              placeholder="Account number"
              value={linkAccountForm.accountNumber}
              onChange={(e) => setLinkAccountForm({ ...linkAccountForm, accountNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select
              value={linkAccountForm.accountType}
              onValueChange={(value) => setLinkAccountForm({ ...linkAccountForm, accountType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nickname (Optional)</Label>
            <Input
              placeholder="e.g., My BoA Checking"
              value={linkAccountForm.nickname}
              onChange={(e) => setLinkAccountForm({ ...linkAccountForm, nickname: e.target.value })}
            />
          </div>
          <Button className="w-full bg-[#0a4fa6] hover:bg-[#083d80]" onClick={handleLinkExternalAccount}>
            Link Account
          </Button>
        </Card>
      </div>
    )
  }

  if (currentView === "viewStatements") {
    const statements = [
      { id: "1", month: "November 2025", date: "Dec 1, 2025", size: "245 KB" },
      { id: "2", month: "October 2025", date: "Nov 1, 2025", size: "238 KB" },
      { id: "3", month: "September 2025", date: "Oct 1, 2025", size: "251 KB" },
      { id: "4", month: "August 2025", date: "Sep 1, 2025", size: "229 KB" },
      { id: "5", month: "July 2025", date: "Aug 1, 2025", size: "234 KB" },
      { id: "6", month: "June 2025", date: "Jul 1, 2025", size: "242 KB" },
    ]

    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("accountManagement")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Account Statements</h2>
        </div>

        <Card className="p-4 space-y-3">
          {statements.map((statement) => (
            <div
              key={statement.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer border"
              onClick={() =>
                toast({
                  title: "Downloading Statement",
                  description: `${statement.month} statement is being downloaded.`,
                })
              }
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#0a4fa6]/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#0a4fa6]" />
                </div>
                <div>
                  <p className="font-medium">{statement.month}</p>
                  <p className="text-sm text-muted-foreground">Generated {statement.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{statement.size}</span>
                <Download className="h-4 w-4 text-[#0a4fa6]" />
              </div>
            </div>
          ))}
        </Card>
      </div>
    )
  }

  if (currentView === "closeAccount") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("accountManagement")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Close Account</h2>
        </div>

        <Card className="p-4 space-y-4 border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <h3 className="font-semibold">Warning: This action is permanent</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Closing your account will permanently remove all your data and cannot be undone. Before closing:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Ensure all pending transactions are complete</li>
            <li>Transfer any remaining balance to another account</li>
            <li>Download any statements you may need</li>
            <li>Cancel any automatic payments linked to this account</li>
          </ul>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Reason for closing (optional)</Label>
            <Textarea
              placeholder="Please tell us why you're closing your account..."
              value={closeAccountReason}
              onChange={(e) => setCloseAccountReason(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="confirmClose"
              checked={closeAccountConfirm}
              onChange={(e) => setCloseAccountConfirm(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="confirmClose" className="text-sm">
              I understand this action is permanent and irreversible
            </Label>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            disabled={!closeAccountConfirm}
            onClick={() => {
              toast({
                title: "Account Closure Request",
                description: "Please call 1-800-935-9935 or visit a branch to complete the account closure process.",
              })
              addActivity({
                action: "Initiated account closure request",
                device: detectDeviceInfo().deviceName,
                location: "Current Location",
              })
            }}
          >
            Request Account Closure
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Or call 1-800-935-9935 to speak with a representative
          </p>
        </Card>
      </div>
    )
  }

  if (currentView === "cards") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Card Management</h2>
        </div>

        <div className="space-y-4">
          {safeCreditCards.map((card) => (
            <Card key={card.id} className="p-4 space-y-4">
              {/* Card Visual */}
              <div className="h-44 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs opacity-70">CHASE</p>
                    <p className="font-semibold">{card.name}</p>
                  </div>
                  {card.locked ? (
                    <div className="bg-red-500 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Locked
                    </div>
                  ) : (
                    <div className="bg-green-500 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Unlock className="h-3 w-3" /> Active
                    </div>
                  )}
                </div>
                <div className="absolute bottom-4 left-4">
                  <p className="text-lg tracking-widest">•••• •••• •••• {card.lastFour}</p>
                  <p className="text-xs opacity-70 mt-1">Expires {card.expiryDate}</p>
                </div>
              </div>

              {/* Card Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Balance</p>
                  <p className="font-bold text-lg">${(card.balance || 0).toLocaleString()}</p>{" "}
                  {/* Changed currency symbol */}
                </div>
                <div>
                  <p className="text-muted-foreground">Credit Limit</p>
                  <p className="font-bold text-lg">${(card.creditLimit || 0).toLocaleString()}</p>{" "}
                  {/* Changed currency symbol */}
                </div>
                <div>
                  <p className="text-muted-foreground">Available Credit</p>
                  <p className="font-bold text-green-600">
                    ${((card.creditLimit || 0) - (card.balance || 0)).toLocaleString()} {/* Changed currency symbol */}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rewards Points</p>
                  <p className="font-bold text-[#0a4fa6]">{(card.rewards || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex gap-2">
                <Button
                  variant={card.locked ? "default" : "destructive"}
                  className={card.locked ? "flex-1 bg-green-600 hover:bg-green-700" : "flex-1"}
                  onClick={() => handleCardLockToggle(card)}
                >
                  {card.locked ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  {card.locked ? "Unlock Card" : "Lock Card"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setSelectedCard(card)
                    setCardSettingsOpen(true)
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Card Settings Dialog */}
        <Dialog open={cardSettingsOpen} onOpenChange={setCardSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Card Settings - {selectedCard?.name}</DialogTitle>
            </DialogHeader>
            {selectedCard && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">International Transactions</p>
                    <p className="text-sm text-muted-foreground">Allow use outside the US</p>
                  </div>
                  <Switch
                    checked={selectedCard.internationalEnabled}
                    onCheckedChange={(checked) => {
                      updateCardSettings(selectedCard.id, { internationalEnabled: checked })
                      addActivity({
                        action: `Settings Change: International transactions ${checked ? "enabled" : "disabled"} for ${selectedCard.name}`,
                        device: detectDeviceInfo().deviceName,
                        location: "Current Location",
                      })
                      toast({ title: "Settings Updated" })
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Contactless Payments</p>
                    <p className="text-sm text-muted-foreground">Tap to pay</p>
                  </div>
                  <Switch
                    checked={selectedCard.contactlessEnabled}
                    onCheckedChange={(checked) => {
                      updateCardSettings(selectedCard.id, { contactlessEnabled: checked })
                      addActivity({
                        action: `Settings Change: Contactless payments ${checked ? "enabled" : "disabled"} for ${selectedCard.name}`,
                        device: detectDeviceInfo().deviceName,
                        location: "Current Location",
                      })
                      toast({ title: "Settings Updated" })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Daily Spending Limit</Label>
                  <Input
                    type="number"
                    value={selectedCard.spendingLimit}
                    onChange={(e) => {
                      updateCardSettings(selectedCard.id, { spendingLimit: Number(e.target.value) })
                    }}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setCardSettingsOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (currentView === "security-devices" || currentView === "devices") {
    return (
      <div className={`pb-24 ${viewAnimClass}`}>
        <LinkedDevicesManager onBack={() => setCurrentView(currentView === "devices" ? "main" : "security")} />
      </div>
    )
  }

  if (currentView === "security-history") {
    // Use the new loginHistory state
    const loginHistoryData = loginHistory || [
      {
        id: "1",
        date: new Date().toISOString(),
        device: "iPhone 15 Pro Max",
        location: "New York, NY",
        status: "success",
        ip: "192.168.1.1",
      },
      {
        id: "2",
        date: new Date(Date.now() - 86400000).toISOString(),
        device: "MacBook Pro",
        location: "New York, NY",
        status: "success",
        ip: "192.168.1.2",
      },
      {
        id: "3",
        date: new Date(Date.now() - 172800000).toISOString(),
        device: "Unknown Device",
        location: "Los Angeles, CA",
        status: "blocked",
        ip: "10.0.0.1",
      },
    ]

    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("security")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Login History</h2>
        </div>

        <Card className="p-4 space-y-4">
          {loginHistoryData.map((login: any) => (
            <div key={login.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    login.status === "success"
                      ? "bg-green-100"
                      : login.status === "failed"
                        ? "bg-yellow-100"
                        : "bg-red-100"
                  }`}
                >
                  {login.status === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : login.status === "failed" ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{login.device}</p>
                  <p className="text-sm text-muted-foreground">{login.location}</p>
                  <p className="text-xs text-muted-foreground">IP: {login.ip}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    login.status === "success" ? "default" : login.status === "failed" ? "secondary" : "destructive"
                  }
                >
                  {login.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(login.date).toLocaleDateString()}
                  <br />
                  {new Date(login.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </Card>
      </div>
    )
  }

  if (currentView === "profile") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-semibold">Profile</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditForm({ ...safeUserProfile })
              setCurrentView("editProfile")
            }}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {safeUserProfile.profilePicture ? (
                  <img
                    src={safeUserProfile.profilePicture || "/placeholder.svg"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-8 w-8 bg-[#0a4fa6] rounded-full flex items-center justify-center shadow-lg"
              >
                <Camera className="h-4 w-4 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureChange}
              />
            </div>
            <h3 className="text-xl font-bold">{safeUserProfile.name}</h3>
            <Badge className="mt-2">{safeUserProfile.tier}</Badge>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-[#0a4fa6]">Account Information</h3>
          <div className="space-y-3">
            {accounts &&
              accounts.map((account) => (
                <div key={account.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
                  </div>
                  <p className="font-bold">${(account.balance || 0).toLocaleString()}</p>
                </div>
              ))}
          </div>
        </Card>

        {/* ... rest of profile view ... */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-[#0a4fa6]">Personal Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{safeUserProfile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{safeUserProfile.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{safeUserProfile.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {safeUserProfile.dateOfBirth
                    ? new Date(safeUserProfile.dateOfBirth).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Social Security</p>
                <p className="font-medium">•••-••-{safeUserProfile.ssn?.slice(-4) || "••••"}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Edit Profile View
  if (currentView === "editProfile") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("profile")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Edit Profile</h2>
        </div>

        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={editForm.email || ""}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={editForm.address || ""}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>
          <Button
            className="w-full bg-[#0a4fa6] hover:bg-[#083d80]"
            onClick={() => {
              updateUserProfile(editForm)
              toast({ title: "Profile Updated", description: "Your changes have been saved." })
              addActivity({
                action: "Profile updated",
                device: detectDeviceInfo().deviceName,
                location: "Current Location",
              })
              setCurrentView("profile")
            }}
          >
            Save Changes
          </Button>
        </Card>
      </div>
    )
  }

  // Help & Support View
  if (currentView === "help") {
    // ... existing help view code
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (helpSubView !== "main") {
                setHelpSubView("main")
              } else {
                setCurrentView("main")
              }
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Help & Support</h2>
        </div>

        {helpSubView === "main" && (
          <>
            {/* Quick Links */}
            <Card className="p-4 space-y-1">
              <h3 className="font-semibold text-[#0a4fa6] mb-3">Quick Links</h3>
              {[
                { label: "FAQs", icon: HelpCircle, subView: "faqs" as HelpSubView },
                { label: "Contact Us", icon: Phone, subView: "contact" as HelpSubView },
                { label: "Chat with Us", icon: MessageCircle, subView: "chat" as HelpSubView },
                { label: "Support Tickets", icon: Ticket, subView: "tickets" as HelpSubView },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => setHelpSubView(item.subView)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">{item.label}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </Card>

            {/* Explore Topics */}
            <Card className="p-4 space-y-1">
              <h3 className="font-semibold text-[#0a4fa6] mb-3">Explore Topics</h3>
              {[
                { label: "Account Management", subView: "topic-account" as HelpSubView },
                { label: "Transfers & Payments", subView: "topic-transfers" as HelpSubView },
                { label: "Card Management", subView: "topic-cards" as HelpSubView },
                { label: "Rewards & Benefits", subView: "topic-rewards" as HelpSubView },
                { label: "Security & Privacy", subView: "topic-security" as HelpSubView },
                { label: "Locations & Hours", subView: "topic-locations" as HelpSubView },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => setHelpSubView(item.subView)}
                >
                  <p className="font-medium">{item.label}</p>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </Card>
          </>
        )}

        {/* Contact Us View */}
        {helpSubView === "contact" && (
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-[#0a4fa6]">Contact Chase</h3>
            <div className="space-y-4">
              <div
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  navigator.clipboard.writeText("1-800-935-9935")
                  toast({ title: "Copied!", description: "Phone number copied to clipboard." })
                }}
              >
                <Phone className="h-5 w-5 text-[#0a4fa6]" />
                <div className="flex-1">
                  <p className="font-medium">Customer Service</p>
                  <p className="text-sm text-muted-foreground">1-800-935-9935</p>
                </div>
                <Copy className="h-4 w-4 text-muted-foreground" />
              </div>
              <div
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  navigator.clipboard.writeText("chase.org_info247@zohomail.com")
                  toast({ title: "Copied!", description: "Email copied to clipboard." })
                }}
              >
                <Mail className="h-5 w-5 text-[#0a4fa6]" />
                <div className="flex-1">
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">chase.org_info247@zohomail.com</p>
                </div>
                <Copy className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Clock className="h-5 w-5 text-[#0a4fa6]" />
                <div>
                  <p className="font-medium">Hours of Operation</p>
                  <p className="text-sm text-muted-foreground">24/7 Customer Support</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Chat View */}
        {helpSubView === "chat" && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="h-10 w-10 rounded-full bg-[#0a4fa6] flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Chase Virtual Assistant</p>
                <p className="text-xs text-green-600">Online</p>
              </div>
            </div>

            <div className="h-64 overflow-y-auto space-y-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${msg.from === "user" ? "bg-[#0a4fa6] text-white" : "bg-muted"}`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.from === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              />
              <Button className="bg-[#0a4fa6] hover:bg-[#083d80]" onClick={handleSendChat}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Tickets View */}
        {helpSubView === "tickets" && (
          <Card className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[#0a4fa6]">Support Tickets</h3>
              <Button
                size="sm"
                className="bg-[#0a4fa6] hover:bg-[#083d80]"
                onClick={() => setHelpSubView("new-ticket")}
              >
                <Plus className="h-4 w-4 mr-1" /> New Ticket
              </Button>
            </div>
            {supportTickets && supportTickets.length > 0 ? (
              <div className="space-y-3">
                {supportTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedTicket(ticket)
                      setHelpSubView("ticket-detail")
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">#{ticket.id.slice(-6)}</p>
                      </div>
                      <Badge
                        variant={
                          ticket.status === "open"
                            ? "destructive"
                            : ticket.status === "in-progress"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No support tickets yet.</p>
              </div>
            )}
          </Card>
        )}

        {/* New Ticket View */}
        {helpSubView === "new-ticket" && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-[#0a4fa6]">Create New Ticket</h3>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={newTicketSubject}
                onChange={(e) => setNewTicketSubject(e.target.value)}
                placeholder="Brief description of your issue"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newTicketCategory} onValueChange={setNewTicketCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="account">Account Issues</SelectItem>
                  <SelectItem value="card">Card Services</SelectItem>
                  <SelectItem value="transfer">Transfers & Payments</SelectItem>
                  <SelectItem value="security">Security Concerns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                rows={4}
                value={newTicketMessage}
                onChange={(e) => setNewTicketMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
              />
            </div>
            <Button className="w-full bg-[#0a4fa6] hover:bg-[#083d80]" onClick={createTicket}>
              Submit Ticket
            </Button>
          </Card>
        )}

        {/* Ticket Detail View */}
        {helpSubView === "ticket-detail" && selectedTicket && (
          <Card className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{selectedTicket.subject}</p>
                <Badge variant={selectedTicket.status === "closed" ? "secondary" : "destructive"}>
                  {selectedTicket.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">#{selectedTicket.id.slice(-6)}</p>
            </div>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-3 bg-muted/20">
              {selectedTicket.messages.map((msg: any, idx: number) => (
                <div key={idx} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${msg.from === "user" ? "bg-[#0a4fa6] text-white" : "bg-background border"}`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.from === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                      {new Date(msg.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {selectedTicket.status !== "closed" && (
              <>
                <Textarea
                  rows={3}
                  value={ticketReply}
                  onChange={(e) => setTicketReply(e.target.value)}
                  placeholder="Enter your reply..."
                />
                <Button
                  className="w-full bg-[#0a4fa6] hover:bg-[#083d80]"
                  onClick={() => addReplyToTicket(selectedTicket.id)}
                  disabled={!ticketReply.trim()}
                >
                  Send Reply
                </Button>
              </>
            )}
          </Card>
        )}

        {/* FAQs View */}
        {helpSubView === "faqs" && (
          <Card className="p-4 space-y-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search FAQs..." />
            </div>
            <div className="space-y-2">
              {faqs &&
                faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${selectedFaq === faq.id ? "bg-muted" : "hover:bg-muted/50"}`}
                    onClick={() => setSelectedFaq(selectedFaq === faq.id ? null : faq.id)}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{faq.question}</p>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${selectedFaq === faq.id ? "rotate-180" : ""}`}
                      />
                    </div>
                    {selectedFaq === faq.id && (
                      <div className="mt-3 pl-4 border-l-2 border-[#0a4fa6]">
                        <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Locations View */}
        {(helpSubView === "locations" || helpSubView === "topic-locations") && (
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-[#0a4fa6]">Find a Branch or ATM</h3>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter City, State, or ZIP Code"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchLocations()}
              />
              <Button className="bg-[#0a4fa6] hover:bg-[#083d80]" onClick={searchLocations}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-48 w-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 h-3 w-3 bg-[#0a4fa6] rounded-full animate-pulse"></div>
                <div className="absolute top-1/3 right-1/3 h-3 w-3 bg-[#0a4fa6] rounded-full animate-pulse delay-100"></div>
                <div className="absolute bottom-1/3 left-1/2 h-3 w-3 bg-[#0a4fa6] rounded-full animate-pulse delay-200"></div>
              </div>
              <div className="text-center">
                <Navigation className="h-12 w-12 text-[#0a4fa6] mx-auto mb-2" />
                <p className="text-muted-foreground">Enter a location to find nearby branches</p>
              </div>
            </div>

            {searchedLocations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Nearby Locations</h4>
                {searchedLocations.map((location) => (
                  <div key={location.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={location.type === "Branch" ? "default" : "secondary"}>{location.type}</Badge>
                          <span className="text-sm text-muted-foreground">{location.distance}</span>
                        </div>
                        <p className="font-medium mt-1">{location.name}</p>
                        <p className="text-sm text-muted-foreground">{location.address}</p>
                        <p className="text-sm text-muted-foreground">Hours: {location.hours}</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <Navigation className="h-4 w-4 mr-1" /> Directions
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Topic Views */}
        {helpSubView === "topic-account" && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-[#0a4fa6]">Account Management</h3>
            <div className="space-y-3">
              {[
                { title: "Update Personal Information", action: () => setCurrentView("editProfile") },
                { title: "Change Username", action: () => setCurrentView("changeUsername") },
                { title: "Link External Accounts", action: () => setCurrentView("linkExternal") },
                { title: "View Account Statements", action: () => setCurrentView("viewStatements") },
                { title: "Close Account", action: () => setCurrentView("closeAccount") },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={item.action}
                >
                  <p className="font-medium">{item.title}</p>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {helpSubView === "topic-transfers" && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-[#0a4fa6]">Transfers & Payments</h3>
            <div className="space-y-3">
              {[
                { title: "Transfer Between Accounts", desc: "Move money between your Chase accounts instantly" },
                { title: "Send with Zelle", desc: "Send money to friends and family using email or phone" },
                { title: "Wire Transfers", desc: "Domestic and international wire transfers" },
                { title: "Pay Bills", desc: "Set up one-time or recurring bill payments" },
                { title: "Transfer Limits", desc: "Daily limit: $10,000 | Monthly limit: $50,000" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => toast({ title: item.title, description: item.desc })}
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {helpSubView === "topic-cards" && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-[#0a4fa6]">Card Management</h3>
            <div className="space-y-3">
              {[
                { title: "Lock/Unlock Card", action: () => setCurrentView("cards") },
                {
                  title: "Report Lost or Stolen",
                  action: () => toast({ title: "Report Card", description: "Call 1-800-935-9935 immediately." }),
                },
                { title: "Set Spending Limits", action: () => setCurrentView("cards") },
                { title: "Enable/Disable Contactless", action: () => setCurrentView("cards") },
                {
                  title: "Request New Card",
                  action: () =>
                    toast({ title: "Request Card", description: "A new card will arrive in 5-7 business days." }),
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={item.action}
                >
                  <p className="font-medium">{item.title}</p>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {helpSubView === "topic-rewards" && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-[#0a4fa6]">Rewards & Benefits</h3>
            <div className="p-4 bg-gradient-to-r from-[#0a4fa6] to-[#117aca] rounded-lg text-white text-center mb-4">
              <p className="text-sm opacity-80">Your Points Balance</p>
              <p className="text-3xl font-bold">{safeUserProfile.ultimateRewardsPoints.toLocaleString()}</p>
              <p className="text-sm opacity-80">
                Worth up to ${(safeUserProfile.ultimateRewardsPoints * 0.0125).toFixed(2)} in travel{" "}
                {/* Changed currency symbol */}
              </p>
            </div>
            <div className="space-y-3">
              {[
                {
                  title: "Redeem for Travel",
                  value: "1.25¢ per point",
                  action: () => {
                    setRedeemType("travel")
                    setCurrentView("rewards")
                  },
                },
                {
                  title: "Redeem for Cash Back",
                  value: "1¢ per point",
                  action: () => {
                    setRedeemType("cashback")
                    setCurrentView("rewards")
                  },
                },
                {
                  title: "Redeem for Gift Cards",
                  value: "1¢ per point",
                  action: () => {
                    setRedeemType("giftcard")
                    setCurrentView("rewards")
                  },
                },
                {
                  title: "Statement Credit",
                  value: "1¢ per point",
                  action: () => {
                    setRedeemType("statement")
                    setCurrentView("rewards")
                  },
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={item.action}
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* THE SECTION TO UPDATE IS BELOW */}
        {helpSubView === "topic-security" && (
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-[#0a4fa6]">Security & Privacy</h3>
            {/* Fixed security menu items syntax */}
            {/* Security Menu Items */}
            <div className="space-y-1">
              {[
                { icon: Lock, label: "Change Password", view: "security-password" as ViewType },
                { icon: Key, label: "Manage Card PIN", view: "security-pin" as ViewType },
                { icon: Smartphone, label: "Two-Factor Authentication", view: "security-2fa" as ViewType },
                { icon: Monitor, label: "Linked Devices", view: "security-devices" as ViewType },
                { icon: History, label: "Login History", view: "security-history" as ViewType },
              ].map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors"
                  onClick={() => setCurrentView(item.view)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#0060A9]/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-[#0060A9]" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
            {/* </CHANGE> */}
          </Card>
        )}
      </div>
    )
  }

  // Security View
  if (currentView === "security") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Security & Privacy</h2>
        </div>

        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-[#0a4fa6]">Account Access</h3>
          {[
            { label: "Password", desc: "Change your password", view: "security-password" as ViewType },
            { label: "PIN", desc: "Manage your card PIN", view: "security-pin" as ViewType },
            {
              label: "Two-Factor Authentication",
              desc: appSettings?.twoFactorAuth ? "Enabled" : "Disabled",
              view: "security-2fa" as ViewType,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer"
              onClick={() => setCurrentView(item.view)}
            >
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          ))}
        </Card>

        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-[#0a4fa6]">Activity</h3>
          {[
            {
              label: "Linked Devices",
              desc: "Manage devices logged into your account",
              view: "security-devices" as ViewType,
            },
            { label: "Login History", desc: "View your recent login activity", view: "security-history" as ViewType },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer"
              onClick={() => setCurrentView(item.view)}
            >
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          ))}
        </Card>
      </div>
    )
  }

  // Chase Ultimate Rewards View
  if (currentView === "rewards") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Chase Ultimate Rewards</h2>
        </div>

        <Card className="p-6 bg-gradient-to-r from-[#0a4fa6] to-[#117aca] text-white">
          <div className="text-center">
            <p className="text-white/80">Points Available</p>
            <p className="text-4xl font-bold mt-2">{safeUserProfile.ultimateRewardsPoints.toLocaleString()}</p>
            <p className="text-white/80 mt-1">
              Worth up to ${(safeUserProfile.ultimateRewardsPoints * 0.0125).toFixed(2)} in travel{" "}
              {/* Changed currency symbol */}
            </p>
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">Redeem Points</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: "travel", label: "Travel", value: "1.25¢/pt", icon: Plane },
              { type: "cashback", label: "Cash Back", value: "1¢/pt", icon: Euro },
              { type: "giftcard", label: "Gift Cards", value: "1¢/pt", icon: Gift },
              { type: "statement", label: "Statement Credit", value: "1¢/pt", icon: FileText },
            ].map((option) => (
              <Card
                key={option.type}
                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${redeemType === option.type ? "ring-2 ring-[#0a4fa6]" : ""}`}
                onClick={() => setRedeemType(option.type as typeof redeemType)}
              >
                <div className="flex flex-col items-center text-center">
                  <option.icon className="h-8 w-8 text-[#0a4fa6] mb-2" />
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.value}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Quick Redeem</h3>
          <div className="grid grid-cols-3 gap-2">
            {[10000, 25000, 50000].map((points) => (
              <Button
                key={points}
                variant="outline"
                className="bg-transparent"
                onClick={() => setRedeemAmount(points.toString())}
              >
                {points.toLocaleString()} pts
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Custom Amount</Label>
            <Input
              type="number"
              placeholder="Enter points"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
            />
            {redeemAmount && (
              <p className="text-sm text-muted-foreground">
                Value: ${(Number.parseInt(redeemAmount) * (redeemType === "travel" ? 0.0125 : 0.01)).toFixed(2)}{" "}
                {/* Changed currency symbol */}
              </p>
            )}
          </div>
          <Button className="w-full bg-[#0a4fa6] hover:bg-[#083d80]" onClick={handleRedeemPoints}>
            Redeem Points
          </Button>
        </Card>

        {rewardRedemptions && rewardRedemptions.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Redemption History</h3>
            <div className="space-y-3">
              {rewardRedemptions.map((redemption) => (
                <div key={redemption.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{redemption.description}</p>
                    <p className="text-sm text-muted-foreground">{new Date(redemption.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+${redemption.value.toFixed(2)}</p>{" "}
                    {/* Changed currency symbol */}
                    <p className="text-xs text-muted-foreground">-${redemption.pointsUsed.toLocaleString()} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    )
  }

  // Utility function for password validation
  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }
  }

  const handlePasswordChange = () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast({
        title: "Passwords Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      })
      return
    }

    const checks = validatePassword(passwordForm.new)
    if (!checks.length || !checks.uppercase || !checks.lowercase || !checks.number) {
      toast({
        title: "Invalid Password",
        description: "Your new password does not meet the security requirements.",
        variant: "destructive",
      })
      return
    }

    setPasswordLoading(true)
    setTimeout(() => {
      setPasswordLoading(false)
      updateUserProfile({ passwordLastChanged: new Date().toISOString() }) // Update last changed date
      addActivity({ action: "Password changed", device: detectDeviceInfo().deviceName, location: "Current Location" })
      toast({ title: "Password Updated", description: "Your password has been changed successfully." })
      setPasswordForm({ current: "", new: "", confirm: "" })
      setCurrentView("security")
    }, 1500)
  }

  const handlePinChange = () => {
    if (pinForm.new !== pinForm.confirm) {
      toast({
        title: "PINs Mismatch",
        description: "New PIN and confirm PIN do not match.",
        variant: "destructive",
      })
      return
    }

    if (pinForm.new.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits.",
        variant: "destructive",
      })
      return
    }

    setPinLoading(true)
    setTimeout(() => {
      setPinLoading(false)
      updateUserProfile({ pinLastChanged: new Date().toISOString() }) // Update last changed date
      addActivity({ action: "Card PIN changed", device: detectDeviceInfo().deviceName, location: "Current Location" })
      toast({ title: "PIN Updated", description: "Your card PIN has been changed successfully." })
      setPinForm({ current: "", new: "", confirm: "" })
      setCurrentView("security")
    }, 1500)
  }

  if (currentView === "security-password") {
    const checks = validatePassword(passwordForm.new)

    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("security")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Change Password</h2>
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Shield className="h-5 w-5 text-[#0a4fa6]" />
            <div>
              <p className="text-sm font-medium text-[#0a4fa6]">Password Security</p>
              <p className="text-xs text-muted-foreground">
                Last changed:{" "}
                {appSettings?.lastPasswordChange
                  ? new Date(appSettings.lastPasswordChange).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                placeholder="Enter current password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <p className="text-sm font-medium">Password Requirements:</p>
            <div className="grid grid-cols-1 gap-1 text-sm">
              <div className={`flex items-center gap-2 ${checks.length ? "text-green-600" : "text-muted-foreground"}`}>
                {checks.length ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                At least 8 characters
              </div>
              <div
                className={`flex items-center gap-2 ${checks.uppercase ? "text-green-600" : "text-muted-foreground"}`}
              >
                {checks.uppercase ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                One uppercase letter
              </div>
              <div
                className={`flex items-center gap-2 ${checks.lowercase ? "text-green-600" : "text-muted-foreground"}`}
              >
                {checks.lowercase ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                One lowercase letter
              </div>
              <div className={`flex items-center gap-2 ${checks.number ? "text-green-600" : "text-muted-foreground"}`}>
                {checks.number ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                One number
              </div>
              <div className={`flex items-center gap-2 ${checks.special ? "text-green-600" : "text-muted-foreground"}`}>
                {checks.special ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                One special character (recommended)
              </div>
            </div>
          </div>

          {passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm && (
            <p className="text-red-500 text-sm">Passwords do not match</p>
          )}

          <Button
            className="w-full bg-[#0a4fa6] hover:bg-[#083d80]"
            onClick={handlePasswordChange}
            disabled={passwordLoading}
          >
            {passwordLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating Password...
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </Card>

        <div className="bg-amber-50 p-3 rounded-md text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">Security Tips</p>
              <ul className="text-xs mt-1 space-y-1">
                <li>• Never share your password with anyone</li>
                <li>• Chase will never ask for your password via email or phone</li>
                <li>• Use a unique password not used on other sites</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "security-pin") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("security")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Manage Card PIN</h2>
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <CreditCard className="h-5 w-5 text-[#0a4fa6]" />
            <div>
              <p className="text-sm font-medium text-[#0a4fa6]">Debit Card PIN</p>
              <p className="text-xs text-muted-foreground">
                Last changed:{" "}
                {appSettings?.lastPinChange ? new Date(appSettings.lastPinChange).toLocaleDateString() : "Never"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Current PIN</Label>
            <div className="relative">
              <Input
                type={showCurrentPin ? "text" : "password"}
                value={pinForm.current}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                  setPinForm({ ...pinForm, current: value })
                }}
                placeholder="••••"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
              >
                {showCurrentPin ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>New PIN</Label>
            <div className="relative">
              <Input
                type={showNewPin ? "text" : "password"}
                value={pinForm.new}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                  setPinForm({ ...pinForm, new: value })
                }}
                placeholder="****"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowNewPin(!showNewPin)}
              >
                {showNewPin ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {pinForm.new && pinForm.new.length < 4 && (
              <p className="text-xs text-muted-foreground">PIN must be 4 digits</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Confirm New PIN</Label>
            <div className="relative">
              <Input
                type={showConfirmPin ? "text" : "password"}
                value={pinForm.confirm}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                  setPinForm({ ...pinForm, confirm: value })
                }}
                placeholder="••••"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
              >
                {showConfirmPin ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {pinForm.new && pinForm.confirm && pinForm.new !== pinForm.confirm && (
            <p className="text-red-500 text-sm">PINs do not match</p>
          )}

          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <p className="text-sm font-medium">PIN Requirements:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Must be exactly 4 digits</li>
              <li>• Avoid simple patterns (1234, 0000, etc.)</li>
              <li>• Don't use your birth year or date</li>
            </ul>
          </div>

          <Button className="w-full bg-[#0a4fa6] hover:bg-[#083d80]" onClick={handlePinChange} disabled={pinLoading}>
            {pinLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating PIN...
              </>
            ) : (
              "Change PIN"
            )}
          </Button>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-[#0a4fa6]">Where to Use Your PIN</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>ATM withdrawals and deposits</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Point of sale purchases</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Cash back at checkout</span>
            </div>
          </div>
        </Card>

        <div className="bg-amber-50 p-3 rounded-md text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">Security Tips</p>
              <ul className="text-xs mt-1 space-y-1">
                <li>• Never share your PIN with anyone</li>
                <li>• Cover the keypad when entering your PIN</li>
                <li>• Memorize your PIN, don't write it down</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === "security-2fa") {
    const handleEnable2FA = () => {
      setTwoFactorLoading(true)
      setTimeout(() => {
        setTwoFactorLoading(false)
        setTwoFactorStep("verify")
        toast({
          title: "Verification Code Sent",
          description: `A code has been sent to your ${twoFactorSetup.method === "sms" ? "phone" : "email"}`,
        })
      }, 1500)
    }

    const handleVerify2FA = () => {
      setTwoFactorLoading(true)
      setTimeout(() => {
        setTwoFactorLoading(false)
        if (twoFactorOTP.length !== 6) {
          setTwoFactorError("Please enter a valid 6-digit code")
          return
        }
        // Generate backup codes
        const codes = Array.from(
          { length: 8 },
          () =>
            Math.random().toString(36).substring(2, 6).toUpperCase() +
            "-" +
            Math.random().toString(36).substring(2, 6).toUpperCase(),
        )
        setBackupCodes(codes)
        setTwoFactorStep("backup")
        toast({
          title: "Code Verified",
          description: "Please save your backup codes",
        })
      }, 1500)
    }

    const handleComplete2FA = () => {
      updateAppSettings({
        twoFactorAuth: true,
        twoFactorMethod: twoFactorSetup.method as "sms" | "email" | "authenticator",
      })
      addActivity({
        action: "Two-Factor Authentication enabled",
        device: detectDeviceInfo().deviceName,
        location: "Current Location",
      })
      setTwoFactorStep("complete")
      toast({
        title: "2FA Enabled",
        description: "Your account is now more secure",
      })
    }

    const handleDisable2FA = () => {
      updateAppSettings({ twoFactorAuth: false })
      addActivity({
        action: "Two-Factor Authentication disabled",
        device: detectDeviceInfo().deviceName,
        location: "Current Location",
      })
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been turned off",
      })
    }

    const copyBackupCodes = () => {
      navigator.clipboard.writeText(backupCodes.join("\n"))
      toast({
        title: "Copied",
        description: "Backup codes copied to clipboard",
      })
    }

    const downloadBackupCodes = () => {
      const content = `Chase Banking Backup Codes\nGenerated: ${new Date().toLocaleDateString()}\n\n${backupCodes.join("\n")}\n\nKeep these codes safe. Each code can only be used once.`
      const blob = new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "chase-backup-codes.txt"
      a.click()
      URL.revokeObjectURL(url)
      toast({
        title: "Downloaded",
        description: "Backup codes saved to file",
      })
    }

    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setCurrentView("security")
              setTwoFactorStep("method")
              setTwoFactorOTP("")
              setTwoFactorError("")
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-semibold">Two-Factor Authentication</h2>
        </div>

        {/* Current Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${appSettings?.twoFactorAuth ? "bg-green-100" : "bg-muted"}`}
              >
                <Shield
                  className={`h-6 w-6 ${appSettings?.twoFactorAuth ? "text-green-600" : "text-muted-foreground"}`}
                />
              </div>
              <div>
                <p className="font-semibold">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {appSettings?.twoFactorAuth
                    ? `Enabled via ${appSettings.twoFactorMethod?.toUpperCase()}`
                    : "Not enabled"}
                </p>
              </div>
            </div>
            <Badge
              variant={appSettings?.twoFactorAuth ? "default" : "secondary"}
              className={appSettings?.twoFactorAuth ? "bg-green-500" : ""}
            >
              {appSettings?.twoFactorAuth ? "Active" : "Inactive"}
            </Badge>
          </div>
        </Card>

        {appSettings?.twoFactorAuth ? (
          // 2FA is enabled - show management options
          <div className="space-y-4">
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold text-[#0a4fa6]">Current Method</h3>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {appSettings.twoFactorMethod === "sms" && <Phone className="h-5 w-5 text-[#0a4fa6]" />}
                {appSettings.twoFactorMethod === "email" && <Mail className="h-5 w-5 text-[#0a4fa6]" />}
                {appSettings.twoFactorMethod === "authenticator" && <Key className="h-5 w-5 text-[#0a4fa6]" />}
                <div>
                  <p className="font-medium capitalize">{appSettings.twoFactorMethod}</p>
                  <p className="text-sm text-muted-foreground">
                    {appSettings.twoFactorMethod === "sms" && appSettings.twoFactorPhone}
                    {appSettings.twoFactorMethod === "email" && appSettings.twoFactorEmail}
                    {appSettings.twoFactorMethod === "authenticator" && "Authenticator App"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold text-[#0a4fa6]">Backup Codes</h3>
              <p className="text-sm text-muted-foreground">
                Backup codes can be used to access your account if you lose access to your primary 2FA method.
              </p>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  const codes = Array.from(
                    { length: 8 },
                    () =>
                      Math.random().toString(36).substring(2, 6).toUpperCase() +
                      "-" +
                      Math.random().toString(36).substring(2, 6).toUpperCase(),
                  )
                  setBackupCodes(codes)
                  setShowBackupCodes(true)
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                Generate New Backup Codes
              </Button>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold text-[#0a4fa6]">Trusted Devices</h3>
              <div className="space-y-2">
                {appSettings.trustedDevices?.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {device.type === "mobile" ? (
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Monitor className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{device.name}</p>
                        <p className="text-xs text-muted-foreground">{device.location}</p>
                      </div>
                    </div>
                    {device.trusted && (
                      <Badge variant="secondary" className="text-xs">
                        Trusted
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Button variant="destructive" className="w-full" onClick={handleDisable2FA}>
              Disable Two-Factor Authentication
            </Button>
          </div>
        ) : (
          // 2FA is not enabled - show setup flow
          <div className="space-y-4">
            {twoFactorStep === "method" && (
              <>
                <Card className="p-4 space-y-4">
                  <h3 className="font-semibold text-[#0a4fa6]">Choose Verification Method</h3>
                  <div className="space-y-3">
                    {[
                      {
                        method: "sms",
                        label: "Text Message (SMS)",
                        desc: `Send codes to ${safeUserProfile.phone}`,
                        icon: Phone,
                      },
                      { method: "email", label: "Email", desc: `Send codes to ${safeUserProfile.email}`, icon: Mail },
                      {
                        method: "authenticator",
                        label: "Authenticator App",
                        desc: "Use Google Authenticator or similar",
                        icon: QrCode,
                      },
                    ].map((option) => (
                      <div
                        key={option.method}
                        className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          twoFactorSetup.method === option.method
                            ? "border-[#0a4fa6] bg-[#0a4fa6]/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setTwoFactorSetup({ ...twoFactorSetup, method: option.method })}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            twoFactorSetup.method === option.method ? "bg-[#0a4fa6]" : "bg-muted"
                          }`}
                        >
                          <option.icon
                            className={`h-5 w-5 ${twoFactorSetup.method === option.method ? "text-white" : "text-muted-foreground"}`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.desc}</p>
                        </div>
                        {twoFactorSetup.method === option.method && <CheckCircle className="h-5 w-5 text-[#0a4fa6]" />}
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-0.5" />
                    <div>
                      <p className="font-medium">Why enable 2FA?</p>
                      <p className="text-xs mt-1">
                        Two-factor authentication adds an extra layer of security to your account by requiring a
                        verification code in addition to your password.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-[#0a4fa6]" onClick={handleEnable2FA} disabled={twoFactorLoading}>
                  {twoFactorLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </>
            )}

            {twoFactorStep === "verify" && (
              <>
                <Card className="p-4 space-y-6">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-[#0a4fa6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-[#0a4fa6]" />
                    </div>
                    <h3 className="font-semibold text-lg">Enter Verification Code</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {twoFactorSetup.method === "sms" && `We sent a code to ${safeUserProfile.phone}`}
                      {twoFactorSetup.method === "email" && `We sent a code to ${safeUserProfile.email}`}
                      {twoFactorSetup.method === "authenticator" && "Enter the code from your authenticator app"}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={twoFactorOTP}
                      onChange={(value) => {
                        setTwoFactorOTP(value)
                        setTwoFactorError("")
                      }}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {twoFactorError && <p className="text-sm text-red-500 text-center">{twoFactorError}</p>}

                  <Button
                    variant="link"
                    className="w-full text-[#0a4fa6]"
                    onClick={() => {
                      toast({
                        title: "Code Resent",
                        description: "A new verification code has been sent",
                      })
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Resend Code
                  </Button>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => {
                      setTwoFactorStep("method")
                      setTwoFactorOTP("")
                      setTwoFactorError("")
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-[#0a4fa6]"
                    onClick={handleVerify2FA}
                    disabled={twoFactorLoading || twoFactorOTP.length !== 6}
                  >
                    {twoFactorLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
              </>
            )}

            {twoFactorStep === "backup" && (
              <>
                <Card className="p-4 space-y-4">
                  <div className="text-center">
                    <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Key className="h-8 w-8 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Save Your Backup Codes</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Save these codes in a safe place. You can use them to access your account if you lose your phone.
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="font-mono text-sm bg-background p-2 rounded text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={copyBackupCodes}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={downloadBackupCodes}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </Card>

                <div className="bg-amber-50 p-3 rounded-md text-sm text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <div>
                      <p className="font-medium">Important</p>
                      <p className="text-xs mt-1">
                        Each backup code can only be used once. Store them securely and don't share them with anyone.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-[#0a4fa6]" onClick={handleComplete2FA}>
                  I've Saved My Codes
                </Button>
              </>
            )}

            {twoFactorStep === "complete" && (
              <Card className="p-6 text-center space-y-4">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="font-semibold text-xl">2FA Enabled Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  Your account is now protected with two-factor authentication.
                </p>
                <Button
                  className="w-full bg-[#0a4fa6]"
                  onClick={() => {
                    setCurrentView("security")
                    setTwoFactorStep("method")
                    setTwoFactorOTP("")
                  }}
                >
                  Done
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Backup Codes Dialog */}
        <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Backup Codes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your old backup codes are no longer valid. Save these new codes in a safe place.
              </p>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm bg-background p-2 rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={copyBackupCodes}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" onClick={downloadBackupCodes}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowBackupCodes(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (currentView === "settings") {
    return (
      <div className={`pb-24 ${viewAnimClass}`}>
        <EnhancedAccountSettings
          onBack={() => setCurrentView("main")}
          userId={userProfile?.id}
        />
      </div>
    )
  }

  // Enhanced Settings View
  if (currentView === "enhancedSettings") {
    return (
      <div className={`pb-24 ${viewAnimClass}`}>
        <EnhancedAccountSettings
          onBack={() => setCurrentView("main")}
          userId={userProfile?.id}
        />
      </div>
    )
  }

  // Notification Center View
  if (currentView === "notificationCenter") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-[#0a4fa6]">Notifications</h2>
              <p className="text-sm text-muted-foreground">
                {unreadNotificationCount} unread {unreadNotificationCount === 1 ? "notification" : "notifications"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {notifications.some((n) => !n.read) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  markAllNotificationsRead()
                  toast({
                    title: "All Marked as Read",
                    description: "All notifications have been marked as read",
                  })
                  addActivity({
                    action: "Marked all notifications as read",
                    device: detectDeviceInfo().deviceName,
                    location: "Current Location",
                  })
                }}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearAllNotificationsAction() // Use the renamed action
                  toast({
                    title: "Cleared",
                    description: "All notifications have been cleared",
                  })
                  addActivity({
                    action: "Cleared all notifications",
                    device: detectDeviceInfo().deviceName,
                    location: "Current Location",
                  })
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Notification Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedNotificationCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedNotificationCategory("all")}
            >
              All
            </Button>
            {["Transactions", "Bills", "Security", "Rewards", "Alerts", "Payments", "Travel"].map((cat) => (
              <Button
                key={cat}
                variant={selectedNotificationCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedNotificationCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </Card>

        {/* Notifications List */}
        <div className="space-y-2">
          {notifications
            .filter((n) => selectedNotificationCategory === "all" || n.category === selectedNotificationCategory)
            .map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                  !notification.read ? "border-l-4 border-l-[#0a4fa6] bg-blue-50/50" : ""
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markNotificationRead(notification.id)
                  }
                  setSelectedNotification(notification.id)
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {notification.type === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {notification.type === "warning" && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                      {notification.type === "alert" && <AlertTriangle className="h-5 w-5 text-red-600" />}
                      {notification.type === "info" && <Info className="h-5 w-5 text-blue-600" />}
                      <h3 className={`font-semibold ${!notification.read ? "text-[#0a4fa6]" : ""}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && <span className="h-2 w-2 rounded-full bg-[#0a4fa6]" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(notification.date), { addSuffix: true })}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {notification.category}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification.id)
                      toast({
                        title: "Deleted",
                        description: "Notification removed",
                      })
                      addActivity({
                        action: "Deleted notification",
                        device: detectDeviceInfo().deviceName,
                        location: "Current Location",
                      })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          {notifications.filter(
            (n) => selectedNotificationCategory === "all" || n.category === selectedNotificationCategory,
          ).length === 0 && (
            <Card className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications in this category</p>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Messages View
  if (currentView === "messages") {
    return (
      <div className={`pb-24 space-y-6 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        {/* List View */}
        {!selectedMessage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-[#0a4fa6]">Messages</h2>
                  <p className="text-sm text-muted-foreground">
                    {unreadMessageCount} unread {unreadMessageCount === 1 ? "message" : "messages"}
                  </p>
                </div>
              </div>
            </div>

            {/* Message Filters */}
            <Card className="p-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedMessageCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMessageCategory("all")}
                >
                  All
                </Button>
                {["Statements", "Offers", "Security", "Rewards", "Mortgage", "Loans"].map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedMessageCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMessageCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Messages List */}
            <div className="space-y-2">
              {messages
                .filter((m) => selectedMessageCategory === "all" || m.category === selectedMessageCategory)
                .map((message) => (
                  <Card
                    key={message.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                      !message.read ? "border-l-4 border-l-[#0a4fa6] bg-blue-50/50" : ""
                    }`}
                    onClick={() => {
                      if (!message.read) {
                        markMessageRead(message.id)
                      }
                      setSelectedMessage(message.id)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-[#0a4fa6]" />
                          <h3 className={`font-semibold ${!message.read ? "text-[#0a4fa6]" : ""}`}>
                            {message.subject}
                          </h3>
                          {!message.read && <span className="h-2 w-2 rounded-full bg-[#0a4fa6]" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">From: {message.from}</p>
                        <p className="text-sm mt-1">{message.preview}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(message.date), { addSuffix: true })}</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{message.category}</span>
                          {message.attachments && message.attachments.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {message.attachments.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMessage(message.id)
                          toast({
                            title: "Deleted",
                            description: "Message removed",
                          })
                          addActivity({
                            action: "Deleted message",
                            device: detectDeviceInfo().deviceName,
                            location: "Current Location",
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              {messages.filter((m) => selectedMessageCategory === "all" || m.category === selectedMessageCategory)
                .length === 0 && (
                <Card className="p-8 text-center">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No messages in this category</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Detail View */}
        {selectedMessage && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setSelectedMessage(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Messages
            </Button>

            {(() => {
              const message = messages.find((m) => m.id === selectedMessage)
              if (!message) return null

              return (
                <Card className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0a4fa6]">{message.subject}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>From: {message.from}</span>
                        <span>{format(new Date(message.date), "MMM dd, yyyy 'at' h:mm a")}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{message.category}</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.attachments && message.attachments.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-semibold mb-2">Attachments</h3>
                          <div className="space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <Button key={index} variant="outline" className="w-full justify-start bg-transparent">
                                <Paperclip className="h-4 w-4 mr-2" />
                                {attachment}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              )
            })()}
          </div>
        )}
      </div>
    )
  }

  // Savings Goals View
  if (currentView === "savings") {
    return (
      <div className={`pb-24 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <SavingsGoalsView />
      </div>
    )
  }

  // Spending Analysis View
  if (currentView === "spending") {
    return (
      <div className={`pb-24 touch-pan-y overscroll-contain ${viewAnimClass}`}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <SpendingAnalysisView />
      </div>
    )
  }

  // Default fallback - return to main
  return (
    <div className="pb-24 touch-pan-y overscroll-contain">
      <Button onClick={() => setCurrentView("main")}>Back to Menu</Button>
    </div>
  )
}
