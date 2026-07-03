import { serve } from "@upstash/workflow/nextjs";
import { sleep } from "workflow";
import { FatalError } from "workflow";

interface SignupData {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

async function createUserAccount(data: SignupData): Promise<void> {
  try {
    console.log(`[v0] Creating account for user ${data.userId} (${data.email})`);

    const response = await fetch("/api/auth/create-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new FatalError(`Account creation failed: ${response.status}`);
    }

    console.log(`[v0] Account created successfully for ${data.email}`);
  } catch (error) {
    throw new FatalError(`Account creation error: ${error}`);
  }
}

async function sendWelcomeEmail(data: SignupData): Promise<void> {
  try {
    console.log(`[v0] Sending welcome email to ${data.email}`);

    const response = await fetch("/api/notifications/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: data.email,
        type: "welcome",
        data: {
          name: data.name,
          userId: data.userId,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[v0] Welcome email sending had issues: ${response.status}`);
    } else {
      console.log(`[v0] Welcome email sent to ${data.email}`);
    }
  } catch (error) {
    console.error(`[v0] Email sending error: ${error}`);
  }
}

async function setupDefaultAccounts(data: SignupData): Promise<void> {
  try {
    console.log(`[v0] Setting up default accounts for user ${data.userId}`);

    const response = await fetch("/api/accounts/setup-default", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: data.userId,
        email: data.email,
      }),
    });

    if (!response.ok) {
      console.warn(`[v0] Default account setup had issues: ${response.status}`);
    } else {
      console.log(`[v0] Default accounts set up for ${data.userId}`);
    }
  } catch (error) {
    console.error(`[v0] Account setup error: ${error}`);
  }
}

async function sendOnboardingTips(data: SignupData): Promise<void> {
  try {
    console.log(`[v0] Sending onboarding tips email to ${data.email}`);

    const response = await fetch("/api/notifications/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: data.email,
        type: "onboarding_tips",
        data: {
          name: data.name,
          userId: data.userId,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[v0] Onboarding tips email sending had issues: ${response.status}`);
    } else {
      console.log(`[v0] Onboarding tips sent to ${data.email}`);
    }
  } catch (error) {
    console.error(`[v0] Onboarding email error: ${error}`);
  }
}

export const { POST } = serve(async (context) => {
  const data = context.requestPayload as SignupData;

  console.log(`[v0] Starting signup workflow for user ${data.userId}`);

  // Step 1: Create the user account
  await context.run("create-account", async () => {
    await createUserAccount(data);
  });

  // Step 2: Send welcome email immediately
  await context.run("send-welcome-email", async () => {
    await sendWelcomeEmail(data);
  });

  // Step 3: Set up default accounts (checking, savings)
  await context.run("setup-default-accounts", async () => {
    await setupDefaultAccounts(data);
  });

  // Step 4: Wait 1 day before sending onboarding tips
  console.log(`[v0] Waiting 1 day before sending onboarding tips...`);
  await sleep("1 day");

  // Step 5: Send onboarding tips email
  await context.run("send-onboarding-tips", async () => {
    await sendOnboardingTips(data);
  });

  console.log(`[v0] Signup workflow completed for user ${data.userId}`);

  return {
    success: true,
    userId: data.userId,
    message: "User signup workflow completed",
  };
});
