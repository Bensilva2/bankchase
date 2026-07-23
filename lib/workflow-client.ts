import { Client } from "@upstash/workflow";

const BASE_URL =
  process.env.VERCEL_URL && !process.env.QSTASH_DEV
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const workflowClient = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

// ============ Type Definitions ============

export interface WorkflowResponse {
  success: boolean;
  workflowRunId?: string;
  message: string;
  error?: string;
}

export interface TransactionPayload {
  transactionId: string;
  userId: string;
  type: "transfer" | "payment" | "deposit" | "withdrawal";
  amount: number;
  fromAccount: string;
  toAccount: string;
  description: string;
  userEmail: string;
  userName: string;
}

export interface SignupPayload {
  userId: string;
  email: string;
  name: string;
}

export interface NotificationPayload {
  userId: string;
  type: "alert" | "promotion" | "security" | "reminder";
  title: string;
  message: string;
  email?: string;
  sms?: string;
  priority?: "low" | "medium" | "high";
}

// ============ Existing Onboarding Workflow ============

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

// ============ Transaction Workflow ============

/**
 * Triggers a transaction processing workflow
 * This handles validation, processing, balance updates, confirmation emails, and logging
 */
export async function triggerTransactionWorkflow(
  payload: TransactionPayload
): Promise<WorkflowResponse> {
  try {
    console.log(
      `[v0] Triggering transaction workflow for ${payload.transactionId}`
    );

    const { workflowRunId } = await workflowClient.trigger({
      url: `${BASE_URL}/api/workflows/transaction`,
      body: {
        transactionId: payload.transactionId,
        userId: payload.userId,
        type: payload.type,
        amount: payload.amount,
        fromAccount: payload.fromAccount,
        toAccount: payload.toAccount,
        description: payload.description,
        userEmail: payload.userEmail,
        userName: payload.userName,
        timestamp: new Date().toISOString(),
      },
      retries: 3,
      timeout: 3600,
    });

    console.log(
      `[v0] Transaction workflow started: ${workflowRunId}`
    );

    return {
      success: true,
      workflowRunId,
      message: "Transaction workflow triggered successfully",
    };
  } catch (error) {
    console.error("[v0] Transaction workflow error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getTransactionStatus(
  transactionId: string
): Promise<{
  status: string;
  message: string;
}> {
  try {
    const response = await fetch(
      `/api/workflows/transaction?id=${transactionId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transaction status");
    }

    return await response.json();
  } catch (error) {
    console.error("[v0] Error fetching transaction status:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============ Signup Workflow ============

/**
 * Triggers a user signup workflow
 * This handles account creation, welcome emails, account setup, and onboarding
 */
export async function triggerSignupWorkflow(
  payload: SignupPayload
): Promise<WorkflowResponse> {
  try {
    console.log(`[v0] Triggering signup workflow for ${payload.userId}`);

    const { workflowRunId } = await workflowClient.trigger({
      url: `${BASE_URL}/api/workflows/signup`,
      body: {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        createdAt: new Date().toISOString(),
      },
      retries: 3,
      timeout: 3600,
    });

    console.log(`[v0] Signup workflow started: ${workflowRunId}`);

    return {
      success: true,
      workflowRunId,
      message: "Signup workflow triggered successfully",
    };
  } catch (error) {
    console.error("[v0] Signup workflow error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getSignupStatus(userId: string): Promise<{
  status: string;
  message: string;
}> {
  try {
    const response = await fetch(`/api/workflows/signup?userId=${userId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch signup status");
    }

    return await response.json();
  } catch (error) {
    console.error("[v0] Error fetching signup status:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============ Notification Workflow ============

/**
 * Triggers a notification workflow
 * This handles creating notifications, sending emails, push notifications, SMS, and logging
 */
export async function triggerNotificationWorkflow(
  payload: NotificationPayload
): Promise<WorkflowResponse> {
  try {
    console.log(
      `[v0] Triggering ${payload.type} notification workflow for user ${payload.userId}`
    );

    const { workflowRunId } = await workflowClient.trigger({
      url: `${BASE_URL}/api/workflows/notification`,
      body: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        email: payload.email,
        sms: payload.sms,
        priority: payload.priority || "medium",
        createdAt: new Date().toISOString(),
      },
      retries: 3,
      timeout: 3600,
    });

    console.log(
      `[v0] Notification workflow started: ${workflowRunId}`
    );

    return {
      success: true,
      workflowRunId,
      message: "Notification workflow triggered successfully",
    };
  } catch (error) {
    console.error("[v0] Notification workflow error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getNotificationStatus(userId: string): Promise<{
  status: string;
  message: string;
}> {
  try {
    const response = await fetch(`/api/workflows/notification?userId=${userId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch notification status");
    }

    return await response.json();
  } catch (error) {
    console.error("[v0] Error fetching notification status:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
