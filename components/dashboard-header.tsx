"use client"

import type React from "react"
import Image from "next/image"

import { MessageSquare, Bell, Search, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"

export function DashboardHeader() {
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const {
    userProfile,
    notifications,
    messages,
    markNotificationRead,
    unreadNotificationCount,
    markMessageRead,
    deleteMessage,
    updateUserProfile,
    markAllNotificationsRead,
    transactions,
  } = useBanking()

  const unreadMessages = messages?.filter((m) => !m.read).length || 0

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        // Compress image if too large for localStorage
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
            description: "Your profile picture has been saved and will persist across devices.",
          })
        }
        img.onerror = () => {
          // If compression fails, use original
          updateUserProfile({ profilePicture: base64Image })
          toast({
            title: "Profile Picture Updated",
            description: "Your profile picture has been saved.",
          })
        }
        img.src = base64Image
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const results = transactions.filter(
        (tx) =>
          tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.reference?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      toast({
        title: `Found ${results.length} results`,
        description: results.length > 0 ? `Matching "${searchQuery}"` : "Try a different search term",
      })
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 chase-gradient transform-gpu backface-hidden pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 relative"
              onClick={() => setMessagesOpen(true)}
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 relative"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Image src="/images/chase-logo.png" alt="Chase" width={36} height={36} className="rounded" loading="eager" />
            <span className="text-white text-xl font-bold tracking-wide">CHASE</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full p-0 h-10 w-10 overflow-hidden hover:ring-2 hover:ring-white/50"
            onClick={() => setProfileOpen(true)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile.profilePicture || "/placeholder.svg"} alt={userProfile.name || ""} />
              <AvatarFallback className="bg-white text-[#0a4fa6] font-semibold">
                {(userProfile.name || "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>

        <form onSubmit={handleSearch} className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions, payees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/95 border-0 h-10 rounded-full"
            />
          </div>
        </form>
      </header>

      {/* Messages Sheet */}
      <Sheet open={messagesOpen} onOpenChange={setMessagesOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#0a4fa6]" />
              Messages
              {unreadMessages > 0 && <Badge variant="destructive">{unreadMessages} new</Badge>}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 max-h-[80vh] overflow-y-auto">
            {messages && messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    msg.read ? "bg-muted/50" : "bg-[#0a4fa6]/5 border-l-4 border-[#0a4fa6]"
                  }`}
                  onClick={() => markMessageRead(msg.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{msg.from}</p>
                      <p className="font-medium text-sm mt-1">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{msg.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteMessage(msg.id)
                      }}
                    >
                      ×
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{getTimeAgo(msg.date)}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No messages</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Notifications Sheet */}
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#0a4fa6]" />
                Notifications
                {unreadNotificationCount > 0 && <Badge variant="destructive">{unreadNotificationCount} new</Badge>}
              </div>
              {unreadNotificationCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#0a4fa6]"
                  onClick={() => {
                    markAllNotificationsRead()
                    toast({ title: "All notifications marked as read" })
                  }}
                >
                  Mark all read
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3 max-h-[80vh] overflow-y-auto">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  notif.read ? "bg-muted/50" : "bg-[#0a4fa6]/5 border-l-4 border-[#0a4fa6]"
                }`}
                onClick={() => markNotificationRead(notif.id)}
              >
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-sm">{notif.title}</p>
                  <Badge
                    variant={
                      notif.type === "alert" ? "destructive" : notif.type === "success" ? "default" : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {notif.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{getTimeAgo(notif.date)}</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Profile Sheet */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Profile</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-[#0a4fa6]">
                  <AvatarImage src={userProfile.profilePicture || "/placeholder.svg"} alt={userProfile.name || ""} />
                  <AvatarFallback className="bg-[#0a4fa6] text-white text-2xl font-bold">
                    {(userProfile.name || "")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#0a4fa6] hover:bg-[#003087]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                />
              </div>
              <h3 className="font-bold text-xl mt-4">{userProfile.name}</h3>
              <p className="text-sm text-muted-foreground">{userProfile.email}</p>
              <Badge className="mt-2 bg-[#0a4fa6]">{userProfile.tier}</Badge>
            </div>

            {/* Account Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Account Information
              </h4>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium">{userProfile.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-medium">{userProfile.memberSince}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Customer ID</span>
                  <span className="text-sm font-medium">****0683</span>
                </div>
              </div>
            </div>

            {/* Rewards Card */}
            <div className="chase-gradient rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm opacity-90">Chase Ultimate Rewards</span>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Private Client
                </Badge>
              </div>
              <p className="text-3xl font-bold">{userProfile.ultimateRewardsPoints?.toLocaleString() || "287,450"}</p>
              <p className="text-sm opacity-80">points available</p>
              <Button variant="secondary" size="sm" className="mt-3 w-full bg-white text-[#0a4fa6] hover:bg-white/90">
                Redeem Points
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start h-12 bg-transparent">
                Account Settings
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-transparent">
                Security & Privacy
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-transparent">
                Help & Support
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 text-destructive bg-transparent">
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
