import { redis } from '@/lib/redis'
import { Notification, BankingEvent, WebhookEventType } from '@/lib/notifications'

export class NotificationService {
  private static readonly NOTIFICATION_PREFIX = 'notifications:'
  private static readonly EVENT_QUEUE = 'banking:events'
  private static readonly CONNECTORS_PREFIX = 'connectors:'

  static async publishNotification(notification: Notification) {
    try {
      // Store in Redis for real-time delivery
      const key = `${this.NOTIFICATION_PREFIX}${notification.userId}`
      const notifications = (await redis.lrange(key, 0, -1)) || []
      
      await redis.lpush(key, JSON.stringify(notification))
      await redis.expire(key, 86400 * 7) // 7 days retention

      console.log('[v0] Notification published:', notification.id)
      return true
    } catch (error) {
      console.error('[v0] Failed to publish notification:', error)
      return false
    }
  }

  static async getNotifications(userId: string, limit = 50) {
    try {
      const key = `${this.NOTIFICATION_PREFIX}${userId}`
      const notifications = await redis.lrange(key, 0, limit - 1)
      
      return notifications?.map(n => JSON.parse(n)) || []
    } catch (error) {
      console.error('[v0] Failed to get notifications:', error)
      return []
    }
  }

  static async markAsRead(userId: string, notificationId: string) {
    try {
      const key = `${this.NOTIFICATION_PREFIX}${userId}`
      const notifications = await redis.lrange(key, 0, -1)
      
      const updated = notifications?.map(n => {
        const notification = JSON.parse(n)
        if (notification.id === notificationId) {
          notification.read = true
        }
        return JSON.stringify(notification)
      }) || []

      if (updated.length > 0) {
        await redis.del(key)
        for (const notif of updated) {
          await redis.lpush(key, notif)
        }
      }
      
      return true
    } catch (error) {
      console.error('[v0] Failed to mark as read:', error)
      return false
    }
  }

  static async publishBankingEvent(event: BankingEvent) {
    try {
      await redis.lpush(this.EVENT_QUEUE, JSON.stringify(event))
      console.log('[v0] Banking event published:', event.eventType)
      return true
    } catch (error) {
      console.error('[v0] Failed to publish banking event:', error)
      return false
    }
  }

  static async getBankingEvents(limit = 100) {
    try {
      const events = await redis.lrange(this.EVENT_QUEUE, 0, limit - 1)
      return events?.map(e => JSON.parse(e)) || []
    } catch (error) {
      console.error('[v0] Failed to get banking events:', error)
      return []
    }
  }

  static async storeConnector(connector: any) {
    try {
      const key = `${this.CONNECTORS_PREFIX}${connector.id}`
      await redis.setex(key, 2592000, JSON.stringify(connector)) // 30 days
      console.log('[v0] Connector stored:', connector.id)
      return true
    } catch (error) {
      console.error('[v0] Failed to store connector:', error)
      return false
    }
  }

  static async getConnectors(userId: string) {
    try {
      const pattern = `${this.CONNECTORS_PREFIX}*`
      const keys = await redis.keys(pattern)
      
      const connectors = []
      for (const key of keys || []) {
        const data = await redis.get(key)
        if (data) {
          const connector = JSON.parse(data)
          if (connector.userId === userId) {
            connectors.push(connector)
          }
        }
      }
      
      return connectors
    } catch (error) {
      console.error('[v0] Failed to get connectors:', error)
      return []
    }
  }

  static async deleteConnector(connectorId: string) {
    try {
      const key = `${this.CONNECTORS_PREFIX}${connectorId}`
      await redis.del(key)
      console.log('[v0] Connector deleted:', connectorId)
      return true
    } catch (error) {
      console.error('[v0] Failed to delete connector:', error)
      return false
    }
  }

  static async triggerWebhook(endpoint: string, payload: any, secret?: string) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (secret) {
        const signature = this.generateSignature(JSON.stringify(payload), secret)
        headers['X-Chase-Signature'] = signature
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      console.log('[v0] Webhook triggered:', endpoint, response.status)
      return response.ok
    } catch (error) {
      console.error('[v0] Failed to trigger webhook:', error)
      return false
    }
  }

  private static generateSignature(payload: string, secret: string): string {
    const crypto = require('crypto')
    return crypto.createHmac('sha256', secret).update(payload).digest('hex')
  }
}
