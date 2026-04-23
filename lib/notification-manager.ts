// Notification Manager for real-time alerts and notifications
// Handles push, email, SMS, and in-app notifications

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
    console.log("[v0] Notification triggered:", payload.title)

    // Add to queue
    this.notificationQueue.push(payload)

    // Process queue
    if (!this.processing) {
      await this.processQueue()
    }
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
      this.addNotification(payload)

      // Send push notification if enabled
      if (canSendPush && "Notification" in window && Notification.permission === "granted") {
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
        } catch (error) {
          console.error("[v0] Push notification error:", error)
        }
      }

      // Log email notification (in real app, would trigger email service)
      if (canSendEmail) {
        console.log("[v0] Email notification would be sent:", payload.title)
      }

      // Log SMS notification (in real app, would trigger SMS service)
      if (canSendSMS) {
        console.log("[v0] SMS notification would be sent:", payload.title)
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
