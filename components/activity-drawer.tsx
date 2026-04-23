"use client"

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import {
  Clock,
  Search,
  Download,
  User,
  LogOut,
  Lock,
  Unlock,
  ArrowRightLeft,
  Receipt,
  Settings,
  Shield,
  Gift,
  DollarSign,
  Smartphone,
  UserCog,
} from "lucide-react"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"

interface ActivityDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivityDrawer({ open, onOpenChange }: ActivityDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string | null>(null)
  const { recentActivity } = useBanking()
  const { toast } = useToast()

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
    if (lowerAction.includes("password") || lowerAction.includes("security") || lowerAction.includes("2fa"))
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
    if (lowerAction.includes("card unlocked")) return "bg-green-100"
    if (lowerAction.includes("card locked")) return "bg-red-100"
    if (lowerAction.includes("signed out") || lowerAction.includes("logout")) return "bg-orange-100"
    if (lowerAction.includes("login") || lowerAction.includes("signed in")) return "bg-blue-100"
    if (lowerAction.includes("transfer")) return "bg-purple-100"
    if (lowerAction.includes("bill") || lowerAction.includes("payment")) return "bg-green-100"
    if (lowerAction.includes("settings")) return "bg-gray-100"
    if (lowerAction.includes("password") || lowerAction.includes("security") || lowerAction.includes("2fa"))
      return "bg-yellow-100"
    return "bg-[#0a4fa6]/10"
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredActivity =
    recentActivity?.filter((activity) => {
      const matchesSearch = activity.action.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = !filterType || activity.action.toLowerCase().includes(filterType.toLowerCase())
      return matchesSearch && matchesFilter
    }) || []

  const handleExport = () => {
    const content = recentActivity
      ?.map((a) => `${new Date(a.date).toLocaleString()} - ${a.action} - ${a.device} - ${a.location}`)
      .join("\n")

    const blob = new Blob([content || ""], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `activity-log-${new Date().toISOString().split("T")[0]}.txt`
    anchor.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Activity Exported",
      description: "Your activity log has been downloaded",
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#0a4fa6]" />
              Recent Activity
            </DrawerTitle>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activity..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {["All", "Login", "Transfer", "Card", "Settings", "Security"].map((filter) => (
              <Button
                key={filter}
                variant={filterType === (filter === "All" ? null : filter.toLowerCase()) ? "default" : "outline"}
                size="sm"
                className={filterType === (filter === "All" ? null : filter.toLowerCase()) ? "bg-[#0a4fa6]" : ""}
                onClick={() => setFilterType(filter === "All" ? null : filter.toLowerCase())}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3 max-h-[60vh]">
          {filteredActivity.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity found</p>
            </div>
          ) : (
            filteredActivity.map((activity, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityBgColor(activity.action)}`}
                  >
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{activity.device}</span>
                      <span>•</span>
                      <span>{activity.location}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(activity.date)}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
