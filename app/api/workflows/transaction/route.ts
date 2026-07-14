import { serve } from "@upstash/workflow/nextjs";

export const { POST } = serve(async (context) => {
  const {
    transactionId,
    userId,
    type,
    amount,
    fromAccount,
    toAccount,
    description,
    userEmail,
    userName,
    timestamp,
  } = context.requestPayload;

  // Step 1: Validate transaction
  const validationResult = await context.run("validate-transaction", async () => {
    if (!transactionId || !userId || !type || !amount || !fromAccount || !toAccount) {
      throw new Error("Missing required transaction fields");
    }

    console.log(`[Workflow] Validating transaction ${transactionId} for user ${userId}`);
    return {
      validated: true,
      transactionId,
      amount,
      type,
    };
  });

  // Step 2: Check balance
  await context.run("check-balance", async () => {
    console.log(`[Workflow] Checking balance for account ${fromAccount}`);
    return {
      balanceChecked: true,
      sufficient: true,
    };
  });

  // Step 3: Process transaction
  await context.run("process-transaction", async () => {
    console.log(`[Workflow] Processing ${type} transaction ${transactionId}`);
    return {
      processed: true,
      status: "completed",
    };
  });

  // Step 4: Update balances
  await context.run("update-balances", async () => {
    console.log(`[Workflow] Updating balances for accounts ${fromAccount} and ${toAccount}`);
    return {
      updated: true,
    };
  });

  // Step 5: Send confirmation email
  await context.run("send-confirmation", async () => {
    if (userEmail) {
      console.log(`[Workflow] Sending confirmation email to ${userEmail}`);
    }
    return {
      emailSent: !!userEmail,
    };
  });

  // Step 6: Log transaction
  await context.run("log-transaction", async () => {
    console.log(`[Workflow] Logging transaction ${transactionId}`);
    return {
      logged: true,
    };
  });

  return {
    success: true,
    message: "Transaction workflow completed successfully",
    transactionId,
    userId,
    amount,
    type,
    completedAt: new Date().toISOString(),
  };
});
