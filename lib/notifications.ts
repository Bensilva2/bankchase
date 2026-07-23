export type NotificationType = 'transfer' | 'deposit' | 'withdrawal' | 'alert' | 'fraud' | 'low_balance'
export type NotificationChannel = 'email' | 'sms' | 'slack' | 'discord' | 'teams' | 'webhook'
export type WebhookEventType = 'transaction.completed' | 'transaction.failed' | 'balance.low' | 'fraud.detected' | 'account.updated'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  channel: NotificationChannel
  title: string
  message: string
  data: Record<string, any>
  read: boolean
  createdAt: Date
  sentAt?: Date
}

export interface WebhookEndpoint {
  id: string
  userId: string
  url: string
  events: WebhookEventType[]
  isActive: boolean
  secret: string
  createdAt: Date
  lastTriggeredAt?: Date
  failureCount: number
}

export interface NotificationPreference {
  id: string
  userId: string
  type: NotificationType
  channels: NotificationChannel[]
  enabled: boolean
}

export interface WebhookConnector {
  id: string
  userId: string
  type: 'slack' | 'discord' | 'teams' | 'email' | 'sms' | 'custom'
  name: string
  config: Record<string, any>
  events: WebhookEventType[]
  isActive: boolean
  createdAt: Date
}

export interface BankingEvent {
  id: string
  userId: string
  eventType: WebhookEventType
  description: string
  data: Record<string, any>
  timestamp: Date
}

export const defaultNotificationPreferences: Record<NotificationType, NotificationChannel[]> = {
  transfer: ['email', 'slack'],
  deposit: ['email'],
  withdrawal: ['email', 'sms'],
  alert: ['email', 'sms'],
  fraud: ['email', 'sms', 'slack'],
  low_balance: ['email', 'slack'],
}

export const connectorTypes = {
  slack: {
    name: 'Slack',
    description: 'Send notifications to Slack channels',
    icon: '💬',
    fields: ['webhookUrl', 'channel'],
  },
  discord: {
    name: 'Discord',
    description: 'Send notifications to Discord channels',
    icon: '🎮',
    fields: ['webhookUrl', 'channel'],
  },
  teams: {
    name: 'Microsoft Teams',
    description: 'Send notifications to Teams channels',
    icon: '👥',
    fields: ['webhookUrl', 'channel'],
  },
  email: {
    name: 'Email',
    description: 'Send email notifications',
    icon: '📧',
    fields: ['emailAddress'],
  },
  sms: {
    name: 'SMS',
    description: 'Send SMS notifications',
    icon: '📱',
    fields: ['phoneNumber'],
  },
  custom: {
    name: 'Custom Webhook',
    description: 'Send to custom webhook endpoint',
    icon: '🔗',
    fields: ['webhookUrl', 'secret'],
  },
}
