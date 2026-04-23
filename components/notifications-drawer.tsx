"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  CheckCheck,
  Shield,
  DollarSign,
  Gift,
  CreditCard,
} from "lucide-react"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"

interface NotificationsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsDrawer({ open, onOpenChange }: NotificationsDrawerProps) {
  const [activeTab, setActiveTab] = useState("all")
  const { notifications, markNotificationRead, deleteNotification, clearAllNotifications, unreadNotificationCount } =
    useBanking()
  const { toast } = useToast()

  const getNotificationIcon = (type: string, category: string) => {
    if (category === "Security") return <Shield className="h-5 w-5 text-red-500" />
    if (category === "Transactions") return <DollarSign className="h-5 w-5 text-green-500" />
    if (category === "Offers") return <Gift className="h-5 w-5 text-purple-500" />
    if (category === "Bills") return <CreditCard className="h-5 w-5 text-orange-500" />

    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "alert":
        return <Shield className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
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

  const filteredNotifications =
    notifications?.filter((n) => {
      if (activeTab === "all") return true
      if (activeTab === "unread") return !n.read
      return n.category.toLowerCase() === activeTab.toLowerCase()
    }) || []

  const handleMarkAllRead = () => {
    notifications?.forEach((n) => {
      if (!n.read) markNotificationRead(n.id)
    })
    toast({
      title: "All Marked as Read",
      description: "All notifications have been marked as read",
    })
  }

  const handleClearAll = () => {
    clearAllNotifications()
    toast({
      title: "Notifications Cleared",
      description: "All notifications have been removed",
    })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#0a4fa6]" />
              Notifications
              {unreadNotificationCount > 0 && <Badge variant="destructive">{unreadNotificationCount}</Badge>}
            </DrawerTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            </div>
          </div>
        </DrawerHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start px-4 py-2 h-auto flex-wrap gap-1">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread {unreadNotificationCount > 0 && `(${unreadNotificationCount})`}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs">
              Security
            </TabsTrigger>
            <TabsTrigger value="offers" className="text-xs">
              Offers
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    !notification.read ? "border-l-4 border-l-[#0a4fa6]" : ""
                  }`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type, notification.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {notification.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{getTimeAgo(notification.date)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  )
}
