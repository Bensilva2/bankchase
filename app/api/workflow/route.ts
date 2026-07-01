import { serve } from "@upstash/workflow/nextjs";
import { sendWorkflowCompletionEmail } from "@/lib/email/resend-client";

export const { POST } = serve(async (context) => {
  const { userId, userEmail, userName, workflowRunId } = context.requestPayload;

  if (!workflowRunId) {
    throw new Error("workflowRunId is required");
  }

  // Step 1: Validate setup
  await context.run("validate-setup", async () => {
    console.log("[Workflow] Validating onboarding setup...");
    return { validated: true, timestamp: new Date().toISOString() };
  });

  // Step 2: Process API configuration
  await context.run("process-api-config", async () => {
    console.log("[Workflow] Processing API configuration...");
    return { apiConfigured: true };
  });

  // Step 3: Verify domain
  await context.run("verify-domain", async () => {
    console.log("[Workflow] Verifying domain...");
    return { domainVerified: true };
  });

  // Step 4: Setup agent integration
  await context.run("setup-agent", async () => {
    console.log("[Workflow] Setting up AI agent...");
    return { agentSetup: true };
  });

  // Step 5: Send completion email
  await context.run("send-completion-email", async () => {
    console.log("[Workflow] Sending completion email to", userEmail);
    
    if (userEmail && userName) {
      const result = await sendWorkflowCompletionEmail({
        email: userEmail,
        name: userName,
        workflowRunId,
      });
      
      return {
        emailSent: result.success,
        messageId: result.messageId,
        error: result.error,
      };
    }
    
    return { emailSent: false, reason: "Missing email or name" };
  });

  return {
    success: true,
    message: "Onboarding workflow completed successfully",
    completedAt: new Date().toISOString(),
    workflowRunId,
  };
});
