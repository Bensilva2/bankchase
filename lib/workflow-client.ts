import { Client } from "@upstash/workflow";

const BASE_URL =
  process.env.VERCEL_URL && !process.env.QSTASH_DEV
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const workflowClient = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

export async function triggerOnboardingWorkflow() {
  try {
    const { workflowRunId } = await workflowClient.trigger({
      url: `${BASE_URL}/api/workflow`,
      headers: {
        "Content-Type": "application/json",
      },
      retries: 3,
      timeout: 3600, // 1 hour timeout
    });

    console.log("[Workflow] Triggered workflow:", workflowRunId);
    return {
      success: true,
      workflowRunId,
      message: "Onboarding workflow started",
    };
  } catch (error) {
    console.error("[Workflow] Error triggering workflow:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getWorkflowStatus(workflowRunId: string) {
  try {
    // In production, you would fetch the status from Upstash
    // For now, return a simulated status
    return {
      runId: workflowRunId,
      status: "completed",
      steps: [
        { name: "validate-setup", status: "completed" },
        { name: "process-api-config", status: "completed" },
        { name: "verify-domain", status: "completed" },
        { name: "setup-agent", status: "completed" },
        { name: "send-notification", status: "completed" },
      ],
    };
  } catch (error) {
    console.error("[Workflow] Error fetching status:", error);
    return null;
  }
}
