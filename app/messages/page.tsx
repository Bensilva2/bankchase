'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { useBanking } from '@/lib/banking-context'
import { Mail, Trash2, Send, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'

export default function MessagesPage() {
  const router = useRouter()
  const { userId, isLoaded } = useAuth()
  const { messages = [], markMessageRead, deleteMessage } = useBanking()
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [replyText, setReplyText] = useState('')

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userId) {
    router.push('/login')
    return null
  }

  const filteredMessages = messages.filter((m: any) =>
    m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.from?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card pb-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Messages</h1>
            <p className="text-muted-foreground">Communications from Chase</p>
          </div>
        </div>

        {selectedMessage ? (
          // Message Detail View
          <Card className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedMessage.subject}</h2>
                <p className="text-muted-foreground text-sm">From: {selectedMessage.from}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {new Date(selectedMessage.date).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-background rounded-lg p-6 mb-6 min-h-24">
              <p className="text-foreground">{selectedMessage.content}</p>
            </div>

            {/* Reply Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-foreground mb-4">Reply</h3>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your message..."
                className="w-full p-4 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
              />
              <div className="flex gap-3 mt-4">
                <button className="flex items-center gap-2 px-6 py-2 bg-primary text-background rounded-lg hover:bg-primary transition">
                  <Send className="w-4 h-4" />
                  Send Reply
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-6 py-2 bg-card text-foreground rounded-lg hover:bg-card transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        ) : (
          // Messages List View
          <>
            {/* Search */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Messages List */}
            <div className="space-y-3">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message: any) => (
                  <Card
                    key={message.id}
                    className={`p-4 cursor-pointer hover:shadow-lg transition ${
                      !message.read ? 'bg-background border-l-4 border-l-blue-600' : 'bg-background'
                    }`}
                    onClick={() => {
                      setSelectedMessage(message)
                      markMessageRead?.(message.id)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <h3 className={`font-semibold ${!message.read ? 'text-blue-600' : 'text-foreground'}`}>
                            {message.subject}
                          </h3>
                          {!message.read && (
                            <span className="ml-auto bg-primary text-background text-xs px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-1">From: {message.from}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(message.date).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMessage?.(message.id)
                        }}
                        className="p-2 hover:bg-background rounded transition text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages to display</p>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
