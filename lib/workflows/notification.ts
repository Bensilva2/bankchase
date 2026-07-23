import { serve } from "@upstash/workflow/nextjs";
import { FatalError } from "workflow";

interface NotificationData {
  userId: string;
  type: "alert" | "promotion" | "security" | "reminder";
  title: string;
  message: string;
  email?: string;
  sms?: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

async function createNotification(data: NotificationData): Promise<string> {
  try {
    console.log(
      `[v0] Creating ${data.priority} priority notification for user ${data.userId}`
    );

    const response = await fetch("/api/notifications/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new FatalError(`Notification creation failed: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[v0] Notification created with ID: ${result.id}`);

    return result.id;
  } catch (error) {
    throw new FatalError(`Notification creation error: ${error}`);
  }
}

async function sendEmailNotification(data: NotificationData): Promise<void> {
  if (!data.email) {
    console.log(`[v0] No email address provided, skipping email notification`);
    return;
  }

  try {
    console.log(`[v0] Sending email notification to ${data.email}`);

    const response = await fetch("/api/notifications/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: data.email,
        type: data.type,
        data: {
          title: data.title,
          message: data.message,
          priority: data.priority,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[v0] Email notification failed: ${response.status}`);
    } else {
      console.log(`[v0] Email notification sent to ${data.email}`);
    }
  } catch (error) {
    console.error(`[v0] Email notification error: ${error}`);
  }
}

async function sendPushNotification(data: NotificationData): Promise<void> {
  try {
    console.log(`[v0] Sending push notification to user ${data.userId}`);

    const response = await fetch("/api/notifications/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: data.userId,
        title: data.title,
        body: data.message,
        priority: data.priority,
      }),
    });

    if (!response.ok) {
      console.warn(`[v0] Push notification failed: ${response.status}`);
    } else {
      console.log(`[v0] Push notification sent to user ${data.userId}`);
    }
  } catch (error) {
    console.error(`[v0] Push notification error: ${error}`);
  }
}

async function sendSMSNotification(data: NotificationData): Promise<void> {
  if (!data.sms) {
    console.log(`[v0] No SMS number provided, skipping SMS notification`);
    return;
  }

  try {
    console.log(`[v0] Sending SMS notification to ${data.sms}`);

    const response = await fetch("/api/notifications/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: data.sms,
        message: data.message,
        priority: data.priority,
      }),
    });

    if (!response.ok) {
      console.warn(`[v0] SMS notification failed: ${response.status}`);
    } else {
      console.log(`[v0] SMS notification sent to ${data.sms}`);
    }
  } catch (error) {
    console.error(`[v0] SMS notification error: ${error}`);
  }
}

async function logNotificationEvent(
  notificationId: string,
  data: NotificationData
): Promise<void> {
  try {
    console.log(`[v0] Logging notification event for ${notificationId}`);

    await fetch("/api/activity/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: data.userId,
        type: "notification",
        action: data.type,
        title: data.title,
        priority: data.priority,
        timestamp: data.createdAt,
      }),
    });

    console.log(`[v0] Notification event logged`);
  } catch (error) {
    console.error(`[v0] Logging error: ${error}`);
  }
}

export const { POST } = serve(async (context) => {
  const data = context.requestPayload as NotificationData;

  console.log(`[v0] Starting notification workflow for user ${data.userId}`);

  // Step 1: Create the notification record
  const notificationId = await context.run("create-notification", async () => {
    return await createNotification(data);
  });

  // Step 2: Send email notification (if email provided)
  if (data.email) {
    await context.run("send-email", async () => {
      await sendEmailNotification(data);
    });
  }

  // Step 3: Send push notification
  await context.run("send-push", async () => {
    await sendPushNotification(data);
  });

  // Step 4: Send SMS notification (if SMS provided and high priority)
  if (data.sms && data.priority === "high") {
    await context.run("send-sms", async () => {
      await sendSMSNotification(data);
    });
  }

  // Step 5: Log the notification event
  await context.run("log-event", async () => {
    await logNotificationEvent(notificationId, data);
  });

  console.log(`[v0] Notification workflow completed for user ${data.userId}`);

  return {
    success: true,
    notificationId,
    userId: data.userId,
    message: "Notification sent successfully",
  };
});
