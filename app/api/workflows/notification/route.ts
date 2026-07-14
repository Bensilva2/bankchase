import { serve } from "@upstash/workflow/nextjs";

export const { POST } = serve(async (context) => {
  const { userId, type, title, message, email, sms, priority = "medium", createdAt } =
    context.requestPayload;

  // Step 1: Validate notification data
  const validationResult = await context.run("validate-notification", async () => {
    if (!userId || !type || !title || !message) {
      throw new Error("Missing required fields (userId, type, title, message)");
    }

    const validTypes = ["alert", "promotion", "security", "reminder"];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid notification type. Must be one of: ${validTypes.join(", ")}`);
    }

    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(priority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(", ")}`);
    }

    console.log(
      `[Workflow] Validating ${priority} priority ${type} notification for user ${userId}`
    );
    return {
      validated: true,
      type,
      priority,
    };
  });

  // Step 2: Create notification record
  await context.run("create-notification", async () => {
    console.log(`[Workflow] Creating notification record for user ${userId}`);
    return {
      created: true,
      timestamp: new Date().toISOString(),
    };
  });

  // Step 3: Send email if provided
  if (email) {
    await context.run("send-email", async () => {
      console.log(`[Workflow] Sending ${type} notification email to ${email}`);
      return {
        emailSent: true,
        recipient: email,
      };
    });
  }

  // Step 4: Send SMS if provided
  if (sms) {
    await context.run("send-sms", async () => {
      console.log(`[Workflow] Sending ${type} notification SMS to ${sms}`);
      return {
        smsSent: true,
        recipient: sms,
      };
    });
  }

  // Step 5: Store in user notification center
  await context.run("store-notification", async () => {
    console.log(`[Workflow] Storing notification in user ${userId} notification center`);
    return {
      stored: true,
    };
  });

  // Step 6: Log notification delivery
  await context.run("log-delivery", async () => {
    console.log(`[Workflow] Logging notification delivery for user ${userId}`);
    return {
      logged: true,
    };
  });

  return {
    success: true,
    message: "Notification workflow completed successfully",
    userId,
    type,
    priority,
    completedAt: new Date().toISOString(),
  };
});
