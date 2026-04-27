import type { Notification, Transaction, AppSettings, Account } from '@/lib/banking-context'

export type AlertType = 'transaction' | 'balance' | 'bill' | 'security' | 'reward'

export interface AlertPreferences {
  transactionAlerts: boolean
  largeTransactionThreshold: number
  balanceAlerts: boolean
  balanceThreshold: number
  billReminders: boolean
  billReminderDays: number
  securityAlerts: boolean
  rewardAlerts: boolean
  lowBalanceAlert: boolean
  lowBalanceThreshold: number
}

// Generate alert for transaction
export function createTransactionAlert(
  transaction: Transaction,
  preferences: Partial<AlertPreferences>,
): Notification | null {
  if (!preferences.transactionAlerts) return null

  const threshold = preferences.largeTransactionThreshold || 500

  if (transaction.type === 'debit' && transaction.amount > threshold) {
    return {
      id: `notif-tx-${transaction.id}`,
      title: 'Large Transaction',
      message: `You spent $${transaction.amount.toFixed(2)} on ${transaction.category}`,
      type: 'alert',
      date: new Date().toISOString(),
      read: false,
      category: 'Transactions',
    }
  }

  if (transaction.type === 'credit' && transaction.category === 'Income') {
    return {
      id: `notif-income-${transaction.id}`,
      title: 'Income Received',
      message: `$${transaction.amount.toFixed(2)} received from ${transaction.description}`,
      type: 'success',
      date: new Date().toISOString(),
      read: false,
      category: 'Transactions',
    }
  }

  return null
}

// Generate alert for low balance
export function createLowBalanceAlert(
  account: Account,
  preferences: Partial<AlertPreferences>,
): Notification | null {
  if (!preferences.lowBalanceAlert) return null

  const threshold = preferences.lowBalanceThreshold || 500

  if (account.balance < threshold) {
    return {
      id: `notif-lowbal-${account.id}`,
      title: 'Low Balance Alert',
      message: `Your ${account.name} balance is below $${threshold.toFixed(2)} (Currently: $${account.balance.toFixed(2)})`,
      type: 'warning',
      date: new Date().toISOString(),
      read: false,
      category: 'Alerts',
    }
  }

  return null
}

// Generate bill due reminder
export function createBillDueAlert(
  billName: string,
  dueDate: Date,
  amount: number,
): Notification {
  return {
    id: `notif-bill-${Date.now()}`,
    title: 'Bill Due Soon',
    message: `${billName} of $${amount.toFixed(2)} is due on ${dueDate.toLocaleDateString()}`,
    type: 'warning',
    date: new Date().toISOString(),
    read: false,
    category: 'Bills',
  }
}

// Generate security alert
export function createSecurityAlert(
  event: string,
  details: string,
): Notification {
  return {
    id: `notif-sec-${Date.now()}`,
    title: 'Security Alert',
    message: `${event}: ${details}`,
    type: 'alert',
    date: new Date().toISOString(),
    read: false,
    category: 'Security',
  }
}

// Generate reward alert
export function createRewardAlert(
  points: number,
  description: string,
): Notification {
  return {
    id: `notif-reward-${Date.now()}`,
    title: 'Rewards Earned',
    message: `You earned ${points.toLocaleString()} points. ${description}`,
    type: 'info',
    date: new Date().toISOString(),
    read: false,
    category: 'Rewards',
  }
}

// Check if bill payment is due soon
export function checkBillReminders(
  bills: Array<{ name: string; dueDate: string; amount: number }>,
  preferences: Partial<AlertPreferences>,
): Notification[] {
  const alerts: Notification[] = []

  if (!preferences.billReminders) return alerts

  const reminderDays = preferences.billReminderDays || 3
  const now = new Date()
  const reminderDate = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000)

  bills.forEach((bill) => {
    const dueDate = new Date(bill.dueDate)

    // If due within the reminder period
    if (dueDate <= reminderDate && dueDate > now) {
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

      alerts.push({
        id: `notif-billreminder-${bill.name}-${dueDate.getTime()}`,
        title: `${bill.name} Due in ${daysUntil} Day${daysUntil !== 1 ? 's' : ''}`,
        message: `Payment of $${bill.amount.toFixed(2)} is due on ${dueDate.toLocaleDateString()}`,
        type: 'warning',
        date: new Date().toISOString(),
        read: false,
        category: 'Bills',
      })
    }
  })

  return alerts
}

// Get alert summary for dashboard
export function getAlertSummary(notifications: Notification[]) {
  const unread = notifications.filter((n) => !n.read)
  const byType = {
    info: unread.filter((n) => n.type === 'info').length,
    warning: unread.filter((n) => n.type === 'warning').length,
    alert: unread.filter((n) => n.type === 'alert').length,
    success: unread.filter((n) => n.type === 'success').length,
  }

  return {
    total: unread.length,
    byType,
    urgent: byType.alert + byType.warning,
  }
}

// Format notification time
export function formatNotificationTime(date: string): string {
  const notifDate = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - notifDate.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return notifDate.toLocaleDateString()
}

// Get notification color based on type
export function getNotificationColor(type: Notification['type']): string {
  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    alert: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  }
  return colors[type] || colors.info
}

// Get notification icon background color
export function getNotificationIconBg(type: Notification['type']): string {
  const colors = {
    info: 'bg-blue-100 text-blue-600',
    warning: 'bg-yellow-100 text-yellow-600',
    alert: 'bg-red-100 text-red-600',
    success: 'bg-green-100 text-green-600',
  }
  return colors[type] || colors.info
}
