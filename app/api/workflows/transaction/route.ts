import { Client } from "@upstash/workflow";
import { NextRequest, NextResponse } from "next/server";

const client = new Client({
  baseUrl: process.env.QSTASH_URL,
  token: process.env.QSTASH_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
    } = body;

    // Validate required fields
    if (
      !transactionId ||
      !userId ||
      !type ||
      !amount ||
      !fromAccount ||
      !toAccount
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`[v0] Triggering transaction workflow for ${transactionId}`);

    // Trigger the workflow
    const workflowRunId = await client.publish({
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/workflows/transaction`,
      body: {
        transactionId,
        userId,
        type,
        amount,
        fromAccount,
        toAccount,
        description,
        timestamp: new Date().toISOString(),
        userEmail,
        userName,
      },
    });

    console.log(
      `[v0] Transaction workflow triggered with ID: ${workflowRunId}`
    );

    return NextResponse.json(
      {
        success: true,
        workflowRunId,
        transactionId,
        message: "Transaction workflow started",
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[v0] Transaction workflow error:", error);
    return NextResponse.json(
      { error: "Failed to start transaction workflow" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("id");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID required" },
        { status: 400 }
      );
    }

    console.log(`[v0] Fetching status for transaction ${transactionId}`);

    return NextResponse.json(
      {
        transactionId,
        status: "processing",
        message: "Transaction is being processed",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] Error fetching transaction status:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction status" },
      { status: 500 }
    );
  }
}
