'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBanking } from '@/lib/banking-context'
import { Mail, Trash2, Send, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'

export default function MessagesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { messages = [], markMessageRead, deleteMessage } = useBanking()
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [replyText, setReplyText] = useState('')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const filteredMessages = messages.filter((m: any) =>
    m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.from?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600">Communications from Chase</p>
          </div>
        </div>

        {selectedMessage ? (
          // Message Detail View
          <Card className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                <p className="text-gray-600 text-sm">From: {selectedMessage.from}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(selectedMessage.date).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 min-h-24">
              <p className="text-gray-800">{selectedMessage.content}</p>
            </div>

            {/* Reply Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Reply</h3>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your message..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                rows={4}
              />
              <div className="flex gap-3 mt-4">
                <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Send className="w-4 h-4" />
                  Send Reply
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
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
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {/* Messages List */}
            <div className="space-y-3">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message: any) => (
                  <Card
                    key={message.id}
                    className={`p-4 cursor-pointer hover:shadow-lg transition ${
                      !message.read ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'bg-white'
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
                          <h3 className={`font-semibold ${!message.read ? 'text-blue-600' : 'text-gray-900'}`}>
                            {message.subject}
                          </h3>
                          {!message.read && (
                            <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-1">From: {message.from}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(message.date).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMessage?.(message.id)
                        }}
                        className="p-2 hover:bg-gray-100 rounded transition text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No messages to display</p>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
