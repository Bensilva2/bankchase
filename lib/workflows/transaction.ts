import { serve } from "@upstash/workflow/nextjs";
import { FatalError } from "workflow";

interface TransactionData {
  transactionId: string;
  userId: string;
  type: "transfer" | "payment" | "deposit" | "withdrawal";
  amount: number;
  fromAccount: string;
  toAccount: string;
  description: string;
  timestamp: string;
  userEmail: string;
  userName: string;
}

async function validateTransaction(
  data: TransactionData
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Validate transaction amount
    if (data.amount <= 0) {
      return { valid: false, error: "Invalid transaction amount" };
    }

    // Validate accounts exist
    if (!data.fromAccount || !data.toAccount) {
      return { valid: false, error: "Invalid account information" };
    }

    return { valid: true };
  } catch (error) {
    throw new FatalError(`Validation failed: ${error}`);
  }
}

async function processTransaction(data: TransactionData): Promise<void> {
  try {
    // Simulate transaction processing
    console.log(
      `[v0] Processing ${data.type} of $${data.amount} from ${data.fromAccount} to ${data.toAccount}`
    );

    // In a real system, this would:
    // 1. Lock both accounts
    // 2. Debit from source account
    // 3. Credit to destination account
    // 4. Record transaction in ledger
    // 5. Release account locks

    // Simulated API call
    const response = await fetch("/api/transactions/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new FatalError(`Transaction processing failed: ${response.status}`);
    }

    console.log(`[v0] Transaction ${data.transactionId} processed successfully`);
  } catch (error) {
    throw new FatalError(`Processing error: ${error}`);
  }
}

async function sendConfirmationEmail(data: TransactionData): Promise<void> {
  try {
    console.log(
      `[v0] Sending confirmation email to ${data.userEmail} for transaction ${data.transactionId}`
    );

    // In a real system, this would use Resend or another email service
    const emailResponse = await fetch("/api/notifications/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: data.userEmail,
        type: "transaction_confirmation",
        data: {
          transactionId: data.transactionId,
          type: data.type,
          amount: data.amount,
          timestamp: data.timestamp,
          description: data.description,
        },
      }),
    });

    if (!emailResponse.ok) {
      throw new FatalError(`Email sending failed: ${emailResponse.status}`);
    }

    console.log(`[v0] Confirmation email sent to ${data.userEmail}`);
  } catch (error) {
    console.error(`[v0] Email sending error: ${error}`);
    // Don't throw - email failures shouldn't block the workflow
  }
}

async function updateAccountBalance(data: TransactionData): Promise<void> {
  try {
    console.log(
      `[v0] Updating account balances for transaction ${data.transactionId}`
    );

    const updateResponse = await fetch("/api/accounts/update-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: data.userId,
        transactionId: data.transactionId,
        fromAccount: data.fromAccount,
        toAccount: data.toAccount,
        amount: data.amount,
      }),
    });

    if (!updateResponse.ok) {
      throw new FatalError(
        `Balance update failed: ${updateResponse.status}`
      );
    }

    console.log(
      `[v0] Account balances updated for transaction ${data.transactionId}`
    );
  } catch (error) {
    throw new FatalError(`Balance update error: ${error}`);
  }
}

async function logTransaction(data: TransactionData): Promise<void> {
  try {
    console.log(
      `[v0] Logging transaction ${data.transactionId} to activity history`
    );

    await fetch("/api/activity/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: data.userId,
        type: "transaction",
        action: data.type,
        amount: data.amount,
        description: data.description,
        timestamp: data.timestamp,
      }),
    });

    console.log(`[v0] Transaction ${data.transactionId} logged`);
  } catch (error) {
    console.error(`[v0] Logging error: ${error}`);
  }
}

export const { POST } = serve(async (context) => {
  const data = context.requestPayload as TransactionData;

  console.log(
    `[v0] Starting transaction workflow for ${data.transactionId}`
  );

  // Step 1: Validate transaction
  const validation = await context.run("validate", async () => {
    return await validateTransaction(data);
  });

  if (!validation.valid) {
    throw new FatalError(`Transaction validation failed: ${validation.error}`);
  }

  // Step 2: Process the transaction
  await context.run("process-transaction", async () => {
    await processTransaction(data);
  });

  // Step 3: Update account balances
  await context.run("update-balances", async () => {
    await updateAccountBalance(data);
  });

  // Step 4: Send confirmation email
  await context.run("send-email", async () => {
    await sendConfirmationEmail(data);
  });

  // Step 5: Log the transaction
  await context.run("log-activity", async () => {
    await logTransaction(data);
  });

  console.log(`[v0] Transaction workflow completed for ${data.transactionId}`);

  return {
    success: true,
    transactionId: data.transactionId,
    message: "Transaction processed successfully",
  };
});
