import { inngest } from "./inngest";

/**
 * Trigger a transaction processing event
 */
export async function triggerTransactionEvent(payload: {
  transactionId: string;
  userId: string;
  amount: number;
  status: "completed" | "failed";
}) {
  try {
    const result = await inngest.send({
      name: "transaction/processed",
      data: {
        ...payload,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`[v0] Transaction event triggered:`, result);
    return result;
  } catch (error) {
    console.error(`[v0] Error triggering transaction event:`, error);
    throw error;
  }
}

/**
 * Trigger a user signup event
 */
export async function triggerSignupEvent(payload: {
  userId: string;
  email: string;
  name: string;
}) {
  try {
    const result = await inngest.send({
      name: "user/signup",
      data: payload,
    });

    console.log(`[v0] Signup event triggered:`, result);
    return result;
  } catch (error) {
    console.error(`[v0] Error triggering signup event:`, error);
    throw error;
  }
}

/**
 * Trigger a notification sending event
 */
export async function triggerNotificationEvent(payload: {
  userId: string;
  type: "alert" | "promotion" | "security" | "reminder";
  title: string;
  message: string;
  channels: ("email" | "push" | "sms")[];
}) {
  try {
    const result = await inngest.send({
      name: "notification/send",
      data: payload,
    });

    console.log(`[v0] Notification event triggered:`, result);
    return result;
  } catch (error) {
    console.error(`[v0] Error triggering notification event:`, error);
    throw error;
  }
}

/**
 * Trigger a webhook request event
 */
export async function triggerWebhookEvent(data: Record<string, any>) {
  try {
    const result = await inngest.send({
      name: "webhook/request.received",
      data,
    });

    console.log(`[v0] Webhook event triggered:`, result);
    return result;
  } catch (error) {
    console.error(`[v0] Error triggering webhook event:`, error);
    throw error;
  }
}
