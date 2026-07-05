'use client'

import { useState, useEffect } from 'react'
import { Mail, Loader2, AlertCircle, ChevronDown } from 'lucide-react'

interface Message {
  id: string
  subject: string
  from: string
  to: string
  text?: string
  html?: string
  extracted_text?: string
  extracted_html?: string
  created_at: string
  read?: boolean
}

interface InboxViewerProps {
  inboxId?: string
  limit?: number
}

export function EmailInboxViewer({ inboxId, limit = 10 }: InboxViewerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (inboxId) {
      fetchMessages()
    }
  }, [inboxId])

  const fetchMessages = async () => {
    if (!inboxId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/email/inbox?inboxId=${inboxId}&action=list-messages&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages')
      }

      setMessages(data.messages || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessageContent = async (messageId: string) => {
    if (!inboxId) return

    try {
      const response = await fetch(
        `/api/email/inbox?inboxId=${inboxId}&action=get-message&messageId=${messageId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch message')
      }

      setSelectedMessage(data.message)
    } catch (err) {
      console.error('Failed to fetch message:', err)
    }
  }

  const handleMessageClick = (message: Message) => {
    if (expandedId === message.id) {
      setExpandedId(null)
      setSelectedMessage(null)
    } else {
      setExpandedId(message.id)
      fetchMessageContent(message.id)
    }
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No messages in this inbox</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-foreground mb-4">
        {messages.length} message{messages.length !== 1 ? 's' : ''}
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        {messages.map((message) => (
          <div key={message.id} className="border-b border-border last:border-b-0">
            <button
              onClick={() => handleMessageClick(message)}
              className="w-full p-4 hover:bg-card transition-colors text-left flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="font-semibold text-foreground">{message.subject}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  From: {message.from}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(message.created_at).toLocaleString()}
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  expandedId === message.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedId === message.id && selectedMessage && (
              <div className="p-4 bg-card border-t border-border">
                <div className="space-y-2 mb-4">
                  <div>
                    <span className="font-semibold text-foreground">From:</span>{' '}
                    <span className="text-muted-foreground">{selectedMessage.from}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">To:</span>{' '}
                    <span className="text-muted-foreground">{selectedMessage.to}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Subject:</span>{' '}
                    <span className="text-muted-foreground">{selectedMessage.subject}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="prose prose-sm max-w-none">
                    {selectedMessage.extracted_html ? (
                      <div
                        className="bg-background p-4 rounded border border-border"
                        dangerouslySetInnerHTML={{ __html: selectedMessage.extracted_html }}
                      />
                    ) : selectedMessage.extracted_text ? (
                      <pre className="bg-background p-4 rounded border border-border text-sm whitespace-pre-wrap break-words">
                        {selectedMessage.extracted_text}
                      </pre>
                    ) : selectedMessage.html ? (
                      <div
                        className="bg-background p-4 rounded border border-border"
                        dangerouslySetInnerHTML={{ __html: selectedMessage.html }}
                      />
                    ) : (
                      <pre className="bg-background p-4 rounded border border-border text-sm whitespace-pre-wrap break-words">
                        {selectedMessage.text || 'No message content'}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={fetchMessages}
        disabled={loading}
        className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Refreshing...' : 'Refresh Messages'}
      </button>
    </div>
  )
}
