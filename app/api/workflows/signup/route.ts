import { Client } from "@upstash/workflow";
import { NextRequest, NextResponse } from "next/server";

const client = new Client({
  baseUrl: process.env.QSTASH_URL,
  token: process.env.QSTASH_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { userId, email, name } = body;

    // Validate required fields
    if (!userId || !email || !name) {
      return NextResponse.json(
        { error: "Missing required fields (userId, email, name)" },
        { status: 400 }
      );
    }

    console.log(
      `[v0] Triggering signup workflow for user ${userId} (${email})`
    );

    // Trigger the workflow
    const workflowRunId = await client.publish({
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/workflows/signup`,
      body: {
        userId,
        email,
        name,
        createdAt: new Date().toISOString(),
      },
    });

    console.log(`[v0] Signup workflow triggered with ID: ${workflowRunId}`);

    return NextResponse.json(
      {
        success: true,
        workflowRunId,
        userId,
        message: "User signup workflow started",
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[v0] Signup workflow error:", error);
    return NextResponse.json(
      { error: "Failed to start signup workflow" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    console.log(`[v0] Fetching signup status for user ${userId}`);

    return NextResponse.json(
      {
        userId,
        status: "processing",
        message: "User signup is being processed",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] Error fetching signup status:", error);
    return NextResponse.json(
      { error: "Failed to fetch signup status" },
      { status: 500 }
    );
  }
}
