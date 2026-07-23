import { serve } from "@upstash/workflow/nextjs";

export const { POST } = serve(async (context) => {
  const { userId, email, name, createdAt } = context.requestPayload;

  // Step 1: Validate signup data
  const validationResult = await context.run("validate-signup", async () => {
    if (!userId || !email || !name) {
      throw new Error("Missing required fields (userId, email, name)");
    }
    
    console.log(`[Workflow] Validating signup for user ${userId} (${email})`);
    return { 
      validated: true, 
      userId,
      email,
      timestamp: new Date().toISOString() 
    };
  });

  // Step 2: Create user account
  await context.run("create-account", async () => {
    console.log(`[Workflow] Creating account for user ${userId}`);
    return { 
      accountCreated: true,
      userId
    };
  });

  // Step 3: Send welcome email
  await context.run("send-welcome-email", async () => {
    console.log(`[Workflow] Sending welcome email to ${email}`);
    return { 
      emailSent: true,
      email
    };
  });

  // Step 4: Setup user preferences
  await context.run("setup-preferences", async () => {
    console.log(`[Workflow] Setting up preferences for user ${userId}`);
    return { 
      preferencesSetup: true
    };
  });

  // Step 5: Complete onboarding
  await context.run("complete-onboarding", async () => {
    console.log(`[Workflow] Completing onboarding for user ${userId}`);
    return { 
      onboardingComplete: true
    };
  });

  return {
    success: true,
    message: "User signup workflow completed successfully",
    userId,
    email,
    completedAt: new Date().toISOString(),
  };
});
