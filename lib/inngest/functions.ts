import { inngest } from "../inngest";

/**
 * Transaction Processing Function
 * Handles complete transaction lifecycle with retries and error handling
 */
export const processTransaction = inngest.createFunction(
  { id: "process-transaction", retries: 3, triggers: [{ event: "transaction/processed" }] },
  async ({ event, step }) => {
    const { transactionId, userId, amount, status } = event.data;

    console.log(`[v0] Processing transaction ${transactionId} for user ${userId}`);

    try {
      // Step 1: Validate transaction
      await step.run("validate-transaction", async () => {
        if (amount <= 0) throw new Error("Invalid transaction amount");
        if (!userId || !transactionId) throw new Error("Missing required fields");
        console.log(`[v0] Transaction ${transactionId} validated`);
        return { valid: true };
      });

      // Step 2: Update account balances
      await step.run("update-balances", async () => {
        // Simulate balance update
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log(`[v0] Updated balances for transaction ${transactionId}`);
        return { balanceUpdated: true };
      });

      // Step 3: Send confirmation email
      await step.run("send-confirmation-email", async () => {
        // Simulate email send
        console.log(
          `[v0] Sent confirmation email for transaction ${transactionId}`
        );
        return { emailSent: true };
      });

      // Step 4: Log activity
      await step.run("log-activity", async () => {
        console.log(`[v0] Logged transaction ${transactionId} to activity log`);
        return { logged: true };
      });

      // Step 5: Wait 1 second for async operations
      await step.sleep("final-delay", "1s");

      return {
        success: true,
        transactionId,
        status: "completed",
        message: `Transaction ${transactionId} processed successfully`,
      };
    } catch (error) {
      console.error(`[v0] Error processing transaction ${transactionId}:`, error);
      return {
        success: false,
        transactionId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

/**
 * User Signup Function
 * Handles new user account setup and onboarding
 */
export const handleUserSignup = inngest.createFunction(
  { id: "handle-user-signup", retries: 2, triggers: [{ event: "user/signup" }] },
  async ({ event, step }) => {
    const { userId, email, name } = event.data;

    console.log(`[v0] Processing signup for user ${userId}`);

    try {
      // Step 1: Create user account
      await step.run("create-user-account", async () => {
        console.log(`[v0] Created account for user ${userId}`);
        return { accountCreated: true };
      });

      // Step 2: Send welcome email
      await step.run("send-welcome-email", async () => {
        console.log(`[v0] Sent welcome email to ${email}`);
        return { emailSent: true };
      });

      // Step 3: Setup default accounts
      await step.run("setup-default-accounts", async () => {
        console.log(`[v0] Set up default accounts for user ${userId}`);
        return { accountsSetup: true };
      });

      // Step 4: Wait 1 day before sending onboarding tips
      await step.sleep("wait-one-day", "24h");

      // Step 5: Send onboarding tips
      await step.run("send-onboarding-tips", async () => {
        console.log(`[v0] Sent onboarding tips to user ${userId}`);
        return { tipsWithContext: true };
      });

      return {
        success: true,
        userId,
        message: `User ${userId} onboarded successfully`,
      };
    } catch (error) {
      console.error(`[v0] Error in user signup for ${userId}:`, error);
      return {
        success: false,
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

/**
 * Notification Sending Function
 * Handles multi-channel notification delivery
 */
export const sendNotification = inngest.createFunction(
  { id: "send-notification", retries: 3, triggers: [{ event: "notification/send" }] },
  async ({ event, step }) => {
    const { userId, type, title, message, channels } = event.data;

    console.log(
      `[v0] Sending ${type} notification to user ${userId} via ${channels.join(", ")}`
    );

    try {
      // Step 1: Create notification record
      await step.run("create-notification", async () => {
        console.log(`[v0] Created ${type} notification record`);
        return { notificationCreated: true };
      });

      // Step 2: Send via email if requested
      if (channels.includes("email")) {
        await step.run("send-email-notification", async () => {
          console.log(`[v0] Sent email notification for ${userId}`);
          return { emailSent: true };
        });
      }

      // Step 3: Send via push if requested
      if (channels.includes("push")) {
        await step.run("send-push-notification", async () => {
          console.log(`[v0] Sent push notification for ${userId}`);
          return { pushSent: true };
        });
      }

      // Step 4: Send via SMS if requested (high priority only)
      if (channels.includes("sms")) {
        await step.run("send-sms-notification", async () => {
          console.log(`[v0] Sent SMS notification for ${userId}`);
          return { smsSent: true };
        });
      }

      // Step 5: Log notification event
      await step.run("log-notification", async () => {
        console.log(`[v0] Logged ${type} notification event`);
        return { logged: true };
      });

      return {
        success: true,
        userId,
        notificationType: type,
        message: `Notification sent via ${channels.join(", ")}`,
      };
    } catch (error) {
      console.error(`[v0] Error sending notification to ${userId}:`, error);
      return {
        success: false,
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

/**
 * Webhook Handler Function
 * Processes incoming webhooks and triggers appropriate events
 */
export const handleWebhookRequest = inngest.createFunction(
  { id: "handle-webhook-request", retries: 2, triggers: [{ event: "webhook/request.received" }] },
  async ({ event, step }) => {
    const { data } = event;

    console.log("[v0] Received webhook request");

    try {
      // Step 1: Validate webhook payload
      await step.run("validate-webhook", async () => {
        if (!data) throw new Error("Empty webhook payload");
        console.log("[v0] Webhook validated");
        return { valid: true };
      });

      // Step 2: Process webhook data
      await step.run("process-webhook-data", async () => {
        console.log("[v0] Processing webhook data");
        // Add custom webhook processing logic here
        return { processed: true };
      });

      // Step 3: Log webhook event
      await step.run("log-webhook-event", async () => {
        console.log("[v0] Logged webhook event");
        return { logged: true };
      });

      return {
        success: true,
        message: "Webhook processed successfully",
      };
    } catch (error) {
      console.error("[v0] Error processing webhook:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

// Export all functions
export const functions = [
  processTransaction,
  handleUserSignup,
  sendNotification,
  handleWebhookRequest,
];
