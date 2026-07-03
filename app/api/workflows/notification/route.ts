import { Client } from "@upstash/workflow";
import { NextRequest, NextResponse } from "next/server";

const client = new Client({
  baseUrl: process.env.QSTASH_URL,
  token: process.env.QSTASH_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { userId, type, title, message, email, sms, priority = "medium" } =
      body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields (userId, type, title, message)" },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = ["alert", "promotion", "security", "reminder"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid notification type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        {
          error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
        },
        { status: 400 }
      );
    }

    console.log(
      `[v0] Triggering ${priority} priority ${type} notification for user ${userId}`
    );

    // Trigger the workflow
    const workflowRunId = await client.publish({
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/workflows/notification`,
      body: {
        userId,
        type,
        title,
        message,
        email,
        sms,
        priority,
        createdAt: new Date().toISOString(),
      },
    });

    console.log(
      `[v0] Notification workflow triggered with ID: ${workflowRunId}`
    );

    return NextResponse.json(
      {
        success: true,
        workflowRunId,
        userId,
        message: "Notification workflow started",
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[v0] Notification workflow error:", error);
    return NextResponse.json(
      { error: "Failed to start notification workflow" },
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

    console.log(`[v0] Fetching notification status for user ${userId}`);

    return NextResponse.json(
      {
        userId,
        status: "sent",
        message: "Notification has been sent",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[v0] Error fetching notification status:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification status" },
      { status: 500 }
    );
  }
}
