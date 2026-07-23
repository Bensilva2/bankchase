'use client'

import { useState } from 'react'
import { Mail, Settings } from 'lucide-react'
import { EmailComposer } from '@/components/email-composer'
import { EmailInboxViewer } from '@/components/email-inbox-viewer'

export default function EmailManagementPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'inbox'>('compose')
  const [inboxId, setInboxId] = useState<string>('')
  const [showInboxSetup, setShowInboxSetup] = useState(true)

  const handleInboxIdSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const id = formData.get('inboxId') as string
    if (id) {
      setInboxId(id)
      setShowInboxSetup(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Email Management</h1>
          </div>
          <p className="text-muted-foreground">
            Compose and manage emails with AgentMail integration
          </p>
        </div>

        {/* Inbox Setup */}
        {showInboxSetup && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Setup Inbox ID
            </h2>
            <p className="text-muted-foreground mb-4">
              Enter your AgentMail inbox ID to view received emails:
            </p>
            <form onSubmit={handleInboxIdSubmit} className="flex gap-2">
              <input
                type="text"
                name="inboxId"
                placeholder="Enter inbox ID (optional)"
                className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors font-semibold"
              >
                Continue
              </button>
            </form>
            <button
              onClick={() => setShowInboxSetup(false)}
              className="text-sm text-primary hover:underline mt-4"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'compose'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Compose Email
          </button>
          {inboxId && (
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                activeTab === 'inbox'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Inbox
            </button>
          )}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-lg p-8">
          {activeTab === 'compose' && (
            <EmailComposer />
          )}

          {activeTab === 'inbox' && inboxId && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Received Messages</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Inbox ID: <code className="bg-background px-2 py-1 rounded">{inboxId}</code>
              </p>
              <EmailInboxViewer inboxId={inboxId} limit={20} />
            </div>
          )}

          {activeTab === 'inbox' && !inboxId && (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No inbox configured</p>
              <button
                onClick={() => setShowInboxSetup(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
              >
                Configure Inbox
              </button>
            </div>
          )}
        </div>

        {/* API Documentation */}
        <div className="mt-12 bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">API Documentation</h2>

          <div className="grid gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Send Email</h3>
              <p className="text-muted-foreground mb-4">
                POST <code className="bg-background px-2 py-1 rounded">/api/email/send</code>
              </p>
              <pre className="bg-background p-4 rounded border border-border overflow-x-auto text-sm">
                {JSON.stringify(
                  {
                    type: 'custom',
                    email: 'user@example.com',
                    name: 'John Doe',
                    subject: 'Your Subject',
                    html: '<p>Your HTML content</p>',
                    text: 'Your plain text content',
                    cc: ['cc@example.com'],
                    bcc: ['bcc@example.com'],
                    replyTo: 'reply@example.com',
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Email Types</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-foreground">onboarding</p>
                  <p className="text-muted-foreground text-sm">
                    Send an onboarding welcome email
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">completion</p>
                  <p className="text-muted-foreground text-sm">
                    Send a workflow completion email (requires workflowRunId)
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">custom</p>
                  <p className="text-muted-foreground text-sm">
                    Send a custom email with subject, html, text, cc, bcc, and replyTo
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">List Messages</h3>
              <p className="text-muted-foreground mb-4">
                GET{' '}
                <code className="bg-background px-2 py-1 rounded">
                  /api/email/inbox?inboxId=YOUR_INBOX_ID&amp;action=list-messages&amp;limit=10
                </code>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Get Message</h3>
              <p className="text-muted-foreground mb-4">
                GET{' '}
                <code className="bg-background px-2 py-1 rounded">
                  /api/email/inbox?inboxId=YOUR_INBOX_ID&amp;action=get-message&amp;messageId=MESSAGE_ID
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
