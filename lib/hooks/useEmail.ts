'use client'

import { useState } from 'react'

interface SendEmailParams {
  type: 'onboarding' | 'completion' | 'custom'
  email: string
  name: string
  workflowRunId?: string
  subject?: string
  html?: string
  text?: string
  cc?: string[]
  bcc?: string[]
  replyTo?: string
}

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

export function useEmail() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendEmail = async (params: SendEmailParams): Promise<EmailResponse> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      return {
        success: true,
        messageId: data.messageId,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    sendEmail,
    loading,
    error,
  }
}

export async function sendEmailServer(params: SendEmailParams): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email')
    }

    return {
      success: true,
      messageId: data.messageId,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
    return {
      success: false,
      error: errorMessage,
    }
  }
}
