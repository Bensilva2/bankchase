// Notification Manager for real-time alerts and notifications
// Handles push, email, SMS, and in-app notifications
import { trace, context, SpanStatusCode } from '@opentelemetry/api'

const tracer = trace.getTracer('notification-manager', '1.0.0')

export interface NotificationPayload {
  title: string
  message: string
  type: "info" | "warning" | "success" | "alert"
  category: string
  actionUrl?: string
  priority?: "low" | "medium" | "high"
  sound?: boolean
}

export class NotificationManager {
  private notificationQueue: NotificationPayload[] = []
  private processing = false

  constructor(
    private shouldSendNotification: (type: string) => boolean,
    private addNotification: (notification: any) => void,
  ) {}

  async send(payload: NotificationPayload) {
    const span = tracer.startSpan('notification.send', {
      attributes: {
        'notification.title': payload.title,
        'notification.message': payload.message,
        'notification.type': payload.type,
        'notification.category': payload.category,
        'notification.priority': payload.priority || 'medium',
        'notification.hasActionUrl': !!payload.actionUrl,
        'notification.sound': payload.sound || false,
      },
    })

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        console.log("[v0] Notification triggered:", payload.title)

        // Add to queue
        this.notificationQueue.push(payload)

        // Process queue
        if (!this.processing) {
          await this.processQueue()
        }

        span.setStatus({ code: SpanStatusCode.OK })
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({ code: SpanStatusCode.ERROR })
        throw error
      } finally {
        span.end()
      }
    })
  }

  private async processQueue() {
    this.processing = true

    while (this.notificationQueue.length > 0) {
      const payload = this.notificationQueue.shift()
      if (!payload) continue

      // Check notification settings before sending
      const canSendPush = this.shouldSendNotification("push")
      const canSendEmail = this.shouldSendNotification("email")
      const canSendSMS = this.shouldSendNotification("sms")

      // Always add to in-app notifications
      const inAppSpan = tracer.startSpan('notification.channel.inapp')
      try {
        this.addNotification(payload)
        inAppSpan.setStatus({ code: SpanStatusCode.OK })
      } catch (error) {
        inAppSpan.recordException(error as Error)
        inAppSpan.setStatus({ code: SpanStatusCode.ERROR })
      } finally {
        inAppSpan.end()
      }

      // Send push notification if enabled
      if (canSendPush && "Notification" in window && Notification.permission === "granted") {
        const pushSpan = tracer.startSpan('notification.channel.push', {
          attributes: {
            'notification.channel': 'push',
            'notification.category': payload.category,
          },
        })
        try {
          const notification = new Notification(payload.title, {
            body: payload.message,
            icon: "/images/chase-logo.png",
            badge: "/images/chase-logo.png",
            tag: payload.category,
            requireInteraction: payload.priority === "high",
          })

          notification.onclick = () => {
            window.focus()
            if (payload.actionUrl) {
              window.location.href = payload.actionUrl
            }
          }

          console.log("[v0] Push notification sent:", payload.title)
          pushSpan.setStatus({ code: SpanStatusCode.OK })
        } catch (error) {
          console.error("[v0] Push notification error:", error)
          pushSpan.recordException(error as Error)
          pushSpan.setStatus({ code: SpanStatusCode.ERROR })
        } finally {
          pushSpan.end()
        }
      }

      // Log email notification (in real app, would trigger email service)
      if (canSendEmail) {
        const emailSpan = tracer.startSpan('notification.channel.email', {
          attributes: {
            'notification.channel': 'email',
            'notification.category': payload.category,
          },
        })
        try {
          console.log("[v0] Email notification would be sent:", payload.title)
          emailSpan.setStatus({ code: SpanStatusCode.OK })
        } catch (error) {
          emailSpan.recordException(error as Error)
          emailSpan.setStatus({ code: SpanStatusCode.ERROR })
        } finally {
          emailSpan.end()
        }
      }

      // Log SMS notification (in real app, would trigger SMS service)
      if (canSendSMS) {
        const smsSpan = tracer.startSpan('notification.channel.sms', {
          attributes: {
            'notification.channel': 'sms',
            'notification.category': payload.category,
          },
        })
        try {
          console.log("[v0] SMS notification would be sent:", payload.title)
          smsSpan.setStatus({ code: SpanStatusCode.OK })
        } catch (error) {
          smsSpan.recordException(error as Error)
          smsSpan.setStatus({ code: SpanStatusCode.ERROR })
        } finally {
          smsSpan.end()
        }
      }

      // Small delay between notifications
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    this.processing = false
  }

  async requestPermission() {
    if (!("Notification" in window)) {
      console.log("[v0] Browser doesn't support notifications")
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }

    return false
  }
}
