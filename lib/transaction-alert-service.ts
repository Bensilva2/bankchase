/**
 * Transaction Alert Service - Real-time alerts for transactions
 * Handles email, SMS, and push notifications
 */

export interface TransactionAlert {
  id: string
  userId: string
  transactionId: string
  type: 'email' | 'sms' | 'push' | 'in-app'
  status: 'pending' | 'sent' | 'failed'
  sentAt?: string
  failureReason?: string
}

export interface TransactionAlertPayload {
  userId: string
  transactionId: string
  userEmail: string
  userPhone?: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category: string
  recipientName?: string
  timestamp: string
  accountNumber?: string
}

export class TransactionAlertService {
  private alertQueue: TransactionAlertPayload[] = []
  private processing = false
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  /**
   * Send transaction alert to user via multiple channels
   */
  async sendAlert(payload: TransactionAlertPayload) {
    console.log('[v0] Transaction alert triggered:', {
      user: payload.userId,
      amount: payload.amount,
      type: payload.type,
    })

    // Add to queue
    this.alertQueue.push(payload)

    // Process queue
    if (!this.processing) {
      await this.processQueue()
    }
  }

  /**
   * Process alert queue
   */
  private async processQueue() {
    this.processing = true

    while (this.alertQueue.length > 0) {
      const payload = this.alertQueue.shift()
      if (!payload) continue

      try {
        // Get user preferences
        const { data: userPrefs } = await this.supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', payload.userId)
          .single()

        const canSendEmail = userPrefs?.enable_email ?? true
        const canSendSMS = userPrefs?.enable_sms ?? true
        const canSendPush = userPrefs?.enable_push ?? true

        // Send alerts in parallel
        const alerts = []

        if (canSendEmail && payload.userEmail) {
          alerts.push(this.sendEmailAlert(payload))
        }

        if (canSendSMS && payload.userPhone) {
          alerts.push(this.sendSMSAlert(payload))
        }

        if (canSendPush) {
          alerts.push(this.sendPushAlert(payload))
        }

        // Always save in-app notification
        alerts.push(this.createInAppAlert(payload))

        await Promise.all(alerts)

        console.log('[v0] Transaction alert sent successfully:', {
          user: payload.userId,
          email: canSendEmail,
          sms: canSendSMS,
          push: canSendPush,
        })
      } catch (error) {
        console.error('[v0] Error processing transaction alert:', error)
      }

      // Small delay between notifications
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    this.processing = false
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(payload: TransactionAlertPayload): Promise<void> {
    try {
      console.log('[v0] Sending email alert to:', payload.userEmail)

      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: payload.userId,
          email: payload.userEmail,
          subject: this.getEmailSubject(payload),
          template: 'transaction-alert',
          data: {
            description: payload.description,
            amount: payload.amount,
            type: payload.type,
            category: payload.category,
            recipientName: payload.recipientName,
            timestamp: new Date(payload.timestamp).toLocaleString(),
            accountNumber: payload.accountNumber,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Email API returned ${response.status}`)
      }

      // Log alert to database
      await this.logAlert(payload.userId, payload.transactionId, 'email', 'sent')

      console.log('[v0] Email alert sent:', payload.userEmail)
    } catch (error) {
      console.error('[v0] Email alert failed:', error)
      await this.logAlert(
        payload.userId,
        payload.transactionId,
        'email',
        'failed',
        String(error)
      )
    }
  }

  /**
   * Send SMS alert
   */
  private async sendSMSAlert(payload: TransactionAlertPayload): Promise<void> {
    try {
      if (!payload.userPhone) {
        console.log('[v0] No phone number for SMS alert')
        return
      }

      console.log('[v0] Sending SMS alert to:', payload.userPhone)

      const response = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: payload.userId,
          phone: payload.userPhone,
          message: this.getSMSMessage(payload),
        }),
      })

      if (!response.ok) {
        throw new Error(`SMS API returned ${response.status}`)
      }

      // Log alert to database
      await this.logAlert(payload.userId, payload.transactionId, 'sms', 'sent')

      console.log('[v0] SMS alert sent:', payload.userPhone)
    } catch (error) {
      console.error('[v0] SMS alert failed:', error)
      await this.logAlert(
        payload.userId,
        payload.transactionId,
        'sms',
        'failed',
        String(error)
      )
    }
  }

  /**
   * Send push notification alert
   */
  private async sendPushAlert(payload: TransactionAlertPayload): Promise<void> {
    try {
      console.log('[v0] Sending push alert')

      const response = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: payload.userId,
          title: this.getPushTitle(payload),
          message: this.getPushMessage(payload),
          data: {
            transactionId: payload.transactionId,
            type: 'transaction',
            amount: payload.amount,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Push API returned ${response.status}`)
      }

      // Log alert to database
      await this.logAlert(payload.userId, payload.transactionId, 'push', 'sent')

      console.log('[v0] Push alert sent')
    } catch (error) {
      console.error('[v0] Push alert failed:', error)
      await this.logAlert(
        payload.userId,
        payload.transactionId,
        'push',
        'failed',
        String(error)
      )
    }
  }

  /**
   * Create in-app alert
   */
  private async createInAppAlert(payload: TransactionAlertPayload): Promise<void> {
    try {
      const { error } = await this.supabase.from('notifications').insert([
        {
          user_id: payload.userId,
          transaction_id: payload.transactionId,
          type: 'transaction_alert',
          title: this.getPushTitle(payload),
          message: this.getPushMessage(payload),
          read: false,
          created_at: new Date().toISOString(),
          metadata: {
            amount: payload.amount,
            category: payload.category,
            recipientName: payload.recipientName,
          },
        },
      ])

      if (error) {
        throw error
      }

      // Log alert to database
      await this.logAlert(payload.userId, payload.transactionId, 'in-app', 'sent')

      console.log('[v0] In-app alert created')
    } catch (error) {
      console.error('[v0] In-app alert creation failed:', error)
    }
  }

  /**
   * Log alert attempt to database
   */
  private async logAlert(
    userId: string,
    transactionId: string,
    type: 'email' | 'sms' | 'push' | 'in-app',
    status: 'pending' | 'sent' | 'failed',
    failureReason?: string
  ): Promise<void> {
    try {
      await this.supabase.from('transaction_alerts').insert([
        {
          user_id: userId,
          transaction_id: transactionId,
          type,
          status,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
          failure_reason: failureReason,
          created_at: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error('[v0] Failed to log alert:', error)
    }
  }

  /**
   * Get email subject
   */
  private getEmailSubject(payload: TransactionAlertPayload): string {
    const action = payload.type === 'credit' ? 'Received' : 'Sent'
    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(payload.amount)

    return `${action} ${amount} - Transaction Alert`
  }

  /**
   * Get SMS message
   */
  private getSMSMessage(payload: TransactionAlertPayload): string {
    const action = payload.type === 'credit' ? 'Received' : 'Sent'
    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(payload.amount)

    const recipient = payload.recipientName ? ` to ${payload.recipientName}` : ''
    return `${action} ${amount}${recipient}. Time: ${new Date(payload.timestamp).toLocaleString()}.`
  }

  /**
   * Get push notification title
   */
  private getPushTitle(payload: TransactionAlertPayload): string {
    const action = payload.type === 'credit' ? 'Money Received' : 'Payment Sent'
    return action
  }

  /**
   * Get push notification message
   */
  private getPushMessage(payload: TransactionAlertPayload): string {
    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(payload.amount)

    const recipient = payload.recipientName ? ` to ${payload.recipientName}` : ''
    return `${amount}${recipient} - ${payload.category}`
  }
}
