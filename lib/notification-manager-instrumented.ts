/**
 * Instrumented Notification Manager
 * Enhanced with OpenTelemetry tracing for all notification channels
 */

import { trace, context, SpanStatusCode } from '@opentelemetry/api'
import {
  instrumentNotificationSend,
  instrumentPushNotificationBrowser,
  instrumentEmailNotificationChannel,
  instrumentSmsNotificationChannel,
  instrumentInAppNotification,
  instrumentNotificationPermissionRequest,
  recordNotificationPermissionStatus,
  instrumentNotificationInteraction,
  instrumentNotificationQueueOperation,
  withNotificationContext,
  withNotificationSpan,
} from './push-notification-instrumentation'

export interface NotificationPayload {
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'alert'
  category: string
  actionUrl?: string
  priority?: 'low' | 'medium' | 'high'
  sound?: boolean
}

export class InstrumentedNotificationManager {
  private notificationQueue: NotificationPayload[] = []
  private processing = false

  constructor(
    private shouldSendNotification: (type: string) => boolean,
    private addNotification: (notification: any) => void,
  ) {}

  async send(payload: NotificationPayload) {
    const span = instrumentNotificationSend(payload)

    return withNotificationContext(span, async () => {
      // Enqueue operation
      const enqueueSpan = instrumentNotificationQueueOperation(
        'enqueue',
        this.notificationQueue.length + 1,
      )
      enqueueSpan.end()

      // Add to queue
      this.notificationQueue.push(payload)

      // Process queue
      if (!this.processing) {
        await this.processQueue()
      }
    })
  }

  private async processQueue() {
    this.processing = true

    while (this.notificationQueue.length > 0) {
      const payload = this.notificationQueue.shift()
      if (!payload) continue

      const processSpan = instrumentNotificationQueueOperation(
        'process',
        this.notificationQueue.length,
      )

      try {
        // Check notification settings before sending
        const canSendPush = this.shouldSendNotification('push')
        const canSendEmail = this.shouldSendNotification('email')
        const canSendSMS = this.shouldSendNotification('sms')

        // Always add to in-app notifications
        const inAppSpan = instrumentInAppNotification(payload.title, payload.category)
        await withNotificationSpan(inAppSpan, () => {
          this.addNotification(payload)
        })

        // Send push notification if enabled
        if (canSendPush && 'Notification' in window && Notification.permission === 'granted') {
          const pushSpan = instrumentPushNotificationBrowser(payload.title, {
            body: payload.message,
            icon: '/images/chase-logo.png',
            badge: '/images/chase-logo.png',
            tag: payload.category,
            requireInteraction: payload.priority === 'high',
          }, payload.category)

          await withNotificationSpan(pushSpan, () => {
            const notification = new Notification(payload.title, {
              body: payload.message,
              icon: '/images/chase-logo.png',
              badge: '/images/chase-logo.png',
              tag: payload.category,
              requireInteraction: payload.priority === 'high',
            })

            notification.onclick = () => {
              const interactionSpan = instrumentNotificationInteraction(
                payload.category,
                'click',
              )
              interactionSpan.end()

              window.focus()
              if (payload.actionUrl) {
                window.location.href = payload.actionUrl
              }
            }

            notification.onclose = () => {
              const closeSpan = instrumentNotificationInteraction(payload.category, 'close')
              closeSpan.end()
            }

            notification.onerror = () => {
              const errorSpan = instrumentNotificationInteraction(payload.category, 'error')
              errorSpan.recordException(new Error('Notification error'))
              errorSpan.end()
            }

            console.log('[v0] Push notification sent:', payload.title)
          })
        }

        // Log email notification (in real app, would trigger email service)
        if (canSendEmail) {
          const emailSpan = instrumentEmailNotificationChannel(
            payload.title,
            payload.category,
          )
          await withNotificationSpan(emailSpan, () => {
            console.log('[v0] Email notification would be sent:', payload.title)
          })
        }

        // Log SMS notification (in real app, would trigger SMS service)
        if (canSendSMS) {
          const smsSpan = instrumentSmsNotificationChannel(payload.title, payload.category)
          await withNotificationSpan(smsSpan, () => {
            console.log('[v0] SMS notification would be sent:', payload.title)
          })
        }

        processSpan.setStatus({ code: SpanStatusCode.OK })
      } catch (error) {
        processSpan.recordException(error as Error)
        processSpan.setStatus({ code: SpanStatusCode.ERROR })
      } finally {
        processSpan.end()
      }

      // Small delay between notifications
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    this.processing = false
  }

  async requestPermission() {
    const span = instrumentNotificationPermissionRequest()

    return withNotificationSpan(span, async () => {
      const supported = 'Notification' in window
      recordNotificationPermissionStatus(span, supported)

      if (!supported) {
        console.log("[v0] Browser doesn't support notifications")
        return false
      }

      const currentStatus = Notification.permission as NotificationPermission | undefined
      recordNotificationPermissionStatus(span, true, currentStatus)

      if (currentStatus === 'granted') {
        return true
      }

      if (currentStatus !== 'denied') {
        const permission = (await Notification.requestPermission()) as NotificationPermission
        recordNotificationPermissionStatus(span, true, permission)
        return permission === 'granted'
      }

      return false
    })
  }
}
