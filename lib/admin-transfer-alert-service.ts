/**
 * Admin Transfer Alert Service - Real-time multi-channel alerts for fund transfers
 * Sends SMS, push notifications, and browser notifications
 */

import crypto from 'crypto'

export interface TransferAlert {
  id: string
  userId: string
  type: 'sms' | 'push' | 'email' | 'in-app'
  title: string
  message: string
  amount: number
  status: 'pending' | 'sent' | 'failed'
  sentAt?: string
}

/**
 * Send real-time alert for admin fund transfer
 */
export async function sendAdminTransferAlert(options: {
  userId: string
  userPhone?: string
  userEmail?: string
  recipientName: string
  amount: number
  accountName: string
  transferId: string
  broadcastToAllDevices?: boolean
}): Promise<{ success: boolean; results: any[] }> {
  const {
    userId,
    userPhone,
    userEmail,
    recipientName,
    amount,
    accountName,
    transferId,
    broadcastToAllDevices = true,
  } = options

  const alertId = crypto.randomUUID()
  const timestamp = new Date().toISOString()
  const results: any[] = []

  console.log('[v0] Initiating transfer alert:', {
    userId,
    amount,
    transferId,
  })

  try {
    // SMS Alert - Immediate high-priority alert
    if (userPhone) {
      const smsResult = await sendTransferSMS({
        phone: userPhone,
        recipientName,
        amount,
        accountName,
        transferId,
        broadcastToAllDevices,
        userId,
      })
      results.push(smsResult)
    }

    // Push Notification - Broadcast to all devices
    if (broadcastToAllDevices) {
      const pushResult = await sendTransferPushNotification({
        userId,
        recipientName,
        amount,
        accountName,
        transferId,
      })
      results.push(pushResult)
    }

    // Browser Notification - Immediate visual alert
    const browserResult = sendBrowserNotification({
      recipientName,
      amount,
      accountName,
    })
    results.push(browserResult)

    // Email Alert - Detailed information
    if (userEmail) {
      const emailResult = await sendTransferEmail({
        email: userEmail,
        recipientName,
        amount,
        accountName,
        transferId,
        timestamp,
      })
      results.push(emailResult)
    }

    console.log('[v0] Transfer alerts sent:', {
      alertId,
      userId,
      channelCount: results.length,
      successCount: results.filter((r) => r.success).length,
    })

    return {
      success: results.some((r) => r.success),
      results,
    }
  } catch (error) {
    console.error('[v0] Error sending transfer alert:', error)
    return {
      success: false,
      results: [
        {
          channel: 'error',
          success: false,
          message: 'Failed to send alerts',
        },
      ],
    }
  }
}

/**
 * Send SMS alert for fund transfer
 */
async function sendTransferSMS(options: {
  phone: string
  recipientName: string
  amount: number
  accountName: string
  transferId: string
  broadcastToAllDevices: boolean
  userId: string
}): Promise<any> {
  try {
    const { phone, recipientName, amount, accountName, transferId, broadcastToAllDevices, userId } = options

    const message = `Chase Alert: $${amount.toFixed(2)} has been added to your ${accountName} by admin. Reference: ${transferId.slice(0, 8)}`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/notifications/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        userId,
        phone,
        message,
        type: 'admin_transfer',
        data: {
          transferId,
          amount,
          accountName,
          recipientName,
        },
        broadcastToDevices: broadcastToAllDevices,
      }),
    })

    const data = await response.json()

    console.log('[v0] SMS alert sent:', {
      transferId,
      phone: phone.slice(-4),
    })

    return {
      channel: 'sms',
      success: response.ok,
      messageId: data.messageId,
      status: data.status,
    }
  } catch (error) {
    console.error('[v0] SMS alert error:', error)
    return {
      channel: 'sms',
      success: false,
      error: 'Failed to send SMS',
    }
  }
}

/**
 * Send push notification for fund transfer
 */
async function sendTransferPushNotification(options: {
  userId: string
  recipientName: string
  amount: number
  accountName: string
  transferId: string
}): Promise<any> {
  try {
    const { userId, recipientName, amount, accountName, transferId } = options

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/notifications/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        userId,
        title: 'Funds Received',
        message: `$${amount.toFixed(2)} added to ${accountName}`,
        data: {
          type: 'admin_transfer',
          transferId,
          amount,
          accountName,
          recipientName,
          timestamp: new Date().toISOString(),
        },
        broadcastToAllDevices: true,
      }),
    })

    const data = await response.json()

    console.log('[v0] Push notification sent:', {
      transferId,
      deviceCount: data.deviceCount,
    })

    return {
      channel: 'push',
      success: response.ok,
      notificationId: data.notificationId,
      deviceCount: data.deviceCount,
    }
  } catch (error) {
    console.error('[v0] Push notification error:', error)
    return {
      channel: 'push',
      success: false,
      error: 'Failed to send push notification',
    }
  }
}

/**
 * Send browser notification for immediate visual alert
 */
function sendBrowserNotification(options: {
  recipientName: string
  amount: number
  accountName: string
}): any {
  // Browser notifications are handled client-side via Supabase real-time listeners
  // in banking-context.tsx. This server-side function just returns a success indicator.
  return {
    channel: 'browser',
    success: true,
    reason: 'Delegated to client-side real-time listener',
  }
}

/**
 * Send email alert for fund transfer
 */
async function sendTransferEmail(options: {
  email: string
  recipientName: string
  amount: number
  accountName: string
  transferId: string
  timestamp: string
}): Promise<any> {
  try {
    const { email, recipientName, amount, accountName, transferId, timestamp } = options

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/notifications/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: `Chase Alert: $${amount.toFixed(2)} deposited to ${accountName}`,
        type: 'admin_transfer',
        data: {
          transferId,
          amount,
          accountName,
          recipientName,
          timestamp,
        },
      }),
    })

    const data = await response.json()

    console.log('[v0] Email alert sent:', {
      transferId,
      email: email.split('@')[0],
    })

    return {
      channel: 'email',
      success: response.ok,
      messageId: data.messageId,
    }
  } catch (error) {
    console.error('[v0] Email alert error:', error)
    return {
      channel: 'email',
      success: false,
      error: 'Failed to send email',
    }
  }
}

/**
 * Setup real-time listeners for transfer updates
 */
export function setupTransferAlertListeners(
  supabase: any,
  onTransferUpdate: (transfer: any) => void
) {
  try {
    const channel = supabase
      .channel('admin_transfers_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_transfers',
          filter: 'status=eq.completed',
        },
        (payload: any) => {
          console.log('[v0] Real-time transfer update:', payload)
          onTransferUpdate(payload.new)
        }
      )
      .subscribe()

    console.log('[v0] Real-time transfer listener setup complete')

    return () => {
      supabase.removeChannel(channel)
    }
  } catch (error) {
    console.error('[v0] Error setting up transfer listeners:', error)
    return () => {}
  }
}

/**
 * Create in-app notification record
 */
export async function createInAppAlert(
  supabase: any,
  options: {
    userId: string
    title: string
    message: string
    type: string
    data: any
  }
): Promise<boolean> {
  try {
    const { userId, title, message, type, data } = options

    const { error } = await supabase.from('notifications').insert([
      {
        user_id: userId,
        title,
        message,
        type,
        data,
        is_read: false,
        category: 'Transactions',
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      throw error
    }

    console.log('[v0] In-app alert created:', { userId, type })
    return true
  } catch (error) {
    console.error('[v0] Error creating in-app alert:', error)
    return false
  }
}
