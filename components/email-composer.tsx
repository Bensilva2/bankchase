'use client'

import { useState } from 'react'
import { Loader2, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { useEmail } from '@/lib/hooks/useEmail'

interface EmailComposerProps {
  recipientEmail?: string
  recipientName?: string
  onSuccess?: () => void
}

type EmailType = 'onboarding' | 'completion' | 'custom'

export function EmailComposer({ 
  recipientEmail = '', 
  recipientName = '',
  onSuccess,
}: EmailComposerProps) {
  const [emailType, setEmailType] = useState<EmailType>('custom')
  const [email, setEmail] = useState(recipientEmail)
  const [name, setName] = useState(recipientName)
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [textContent, setTextContent] = useState('')
  const [workflowRunId, setWorkflowRunId] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const { sendEmail, loading, error } = useEmail()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (!email) {
      alert('Please fill in email field')
      return
    }

    if (emailType === 'custom') {
      if (!subject) {
        alert('Please enter a subject for custom emails')
        return
      }
    } else {
      if (!name) {
        alert('Please fill in name field')
        return
      }
    }

    if (emailType === 'completion' && !workflowRunId) {
      alert('Please enter a workflow run ID for completion emails')
      return
    }

    const params: any = {
      type: emailType,
      email,
    }

    if (name) {
      params.name = name
    }

    if (emailType === 'completion') {
      params.workflowRunId = workflowRunId
    }

    if (emailType === 'custom') {
      params.subject = subject
      if (htmlContent) params.html = htmlContent
      if (textContent) params.text = textContent
      if (cc) params.cc = cc.split(',').map(e => e.trim()).filter(e => e)
      if (bcc) params.bcc = bcc.split(',').map(e => e.trim()).filter(e => e)
      if (replyTo) params.replyTo = replyTo
    }

    const result = await sendEmail(params)

    if (result.success) {
      setSuccessMessage(`Email sent successfully! Message ID: ${result.messageId}`)
      
      // Reset form
      setEmail('')
      setName('')
      setSubject('')
      setHtmlContent('')
      setTextContent('')
      setWorkflowRunId('')
      setCc('')
      setBcc('')
      setReplyTo('')
      setSubmitted(false)

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Email Composer</h2>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Email Type
            </label>
            <select
              value={emailType}
              onChange={(e) => setEmailType(e.target.value as EmailType)}
              disabled={loading}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground disabled:opacity-50"
            >
              <option value="onboarding">Onboarding Email</option>
              <option value="completion">Completion Email</option>
              <option value="custom">Custom Email</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Recipient Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="user@example.com"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Recipient Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder="John Doe"
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
            required
          />
        </div>

        {emailType === 'completion' && (
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Workflow Run ID
            </label>
            <input
              type="text"
              value={workflowRunId}
              onChange={(e) => setWorkflowRunId(e.target.value)}
              disabled={loading}
              placeholder="workflow-123456"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              required={emailType === 'completion'}
            />
          </div>
        )}

        {emailType === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                placeholder="Email subject"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                required={emailType === 'custom'}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                HTML Content
              </label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                disabled={loading}
                placeholder="<p>Your HTML email content</p>"
                rows={6}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Plain Text Content
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={loading}
                placeholder="Your plain text email content"
                rows={4}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  CC (comma separated)
                </label>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  disabled={loading}
                  placeholder="user1@example.com, user2@example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  BCC (comma separated)
                </label>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  disabled={loading}
                  placeholder="user3@example.com, user4@example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Reply-To
                </label>
                <input
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  disabled={loading}
                  placeholder="reply@example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 text-sm"
                />
              </div>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading || submitted}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Email
            </>
          )}
        </button>
      </form>
    </div>
  )
}
