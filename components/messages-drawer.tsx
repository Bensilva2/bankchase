"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, Mail, Trash2, Reply, Search, Send, Paperclip, Download, Share2 } from "lucide-react"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"

interface MessagesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MessagesDrawer({ open, onOpenChange }: MessagesDrawerProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { messages, markMessageRead, deleteMessage, addMessage, addActivity } = useBanking()
  const { toast } = useToast()

  const filteredMessages =
    messages?.filter(
      (m) =>
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  const selectedMessage = messages?.find((m) => m.id === selectedMessageId)

  const handleSelectMessage = (messageId: string) => {
    setSelectedMessageId(messageId)
    markMessageRead(messageId)
  }

  const handleDelete = (messageId: string) => {
    deleteMessage(messageId)
    if (selectedMessageId === messageId) {
      setSelectedMessageId(null)
    }
    toast({
      title: "Message Deleted",
      description: "The message has been removed",
    })
  }

  const handleReply = () => {
    if (!replyContent.trim()) return

    addMessage({
      from: "You",
      subject: `Re: ${selectedMessage?.subject}`,
      preview: replyContent.substring(0, 100),
      content: replyContent,
      category: "Sent",
    })

    addActivity({
      action: `Sent reply to ${selectedMessage?.from}`,
      device: "iPhone 15 Pro Max",
      location: "New York, NY",
    })

    toast({
      title: "Reply Sent",
      description: "Your message has been sent",
    })

    setReplyContent("")
    setReplyOpen(false)
  }

  const handleShare = (message: typeof selectedMessage) => {
    if (navigator.share) {
      navigator.share({
        title: message?.subject,
        text: message?.content,
      })
    } else {
      navigator.clipboard.writeText(message?.content || "")
      toast({
        title: "Copied",
        description: "Message content copied to clipboard",
      })
    }
  }

  const handleDownload = (message: typeof selectedMessage) => {
    const content = `From: ${message?.from}\nSubject: ${message?.subject}\nDate: ${new Date(message?.date || "").toLocaleString()}\n\n${message?.content}`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `message-${message?.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Downloaded",
      description: "Message saved to file",
    })
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

  const renderMessageList = () => (
    <div className="space-y-4 p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredMessages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No messages found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                !message.read ? "border-l-4 border-l-[#0a4fa6] bg-[#0a4fa6]/5" : ""
              }`}
              onClick={() => handleSelectMessage(message.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-[#0a4fa6] text-white text-xs">
                      {message.from
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-medium truncate ${!message.read ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {message.from}
                      </p>
                      {!message.read && (
                        <Badge variant="default" className="bg-[#0a4fa6] text-[10px]">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm truncate ${!message.read ? "font-medium" : ""}`}>{message.subject}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{message.preview}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{getTimeAgo(message.date)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(message.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderMessageDetail = () => {
    if (!selectedMessage) return null

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setSelectedMessageId(null)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium">Message</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-[#0a4fa6] text-white">
                {selectedMessage.from
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{selectedMessage.from}</p>
              <p className="text-sm text-muted-foreground">{new Date(selectedMessage.date).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{selectedMessage.subject}</h3>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
              {selectedMessage.content}
            </div>
          </div>

          {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
            <Card className="p-4">
              <p className="text-sm font-medium mb-2">Attachments</p>
              <div className="space-y-2">
                {selectedMessage.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1">{attachment}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="border-t p-4 space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setReplyOpen(!replyOpen)}>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleShare(selectedMessage)}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleDownload(selectedMessage)}>
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-red-500 bg-transparent"
              onClick={() => handleDelete(selectedMessage.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {replyOpen && (
            <div className="space-y-3">
              <Textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button className="flex-1 bg-[#0a4fa6]" onClick={handleReply}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reply
                </Button>
                <Button variant="outline" onClick={() => setReplyOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#0a4fa6]" />
            Messages
            {messages && messages.filter((m) => !m.read).length > 0 && (
              <Badge variant="destructive">{messages.filter((m) => !m.read).length} new</Badge>
            )}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden">{selectedMessageId ? renderMessageDetail() : renderMessageList()}</div>
      </DrawerContent>
    </Drawer>
  )
}
