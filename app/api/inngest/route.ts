import { NextRequest, NextResponse } from "next/server";

// Inngest endpoint - currently disabled to use simplified workflow approach
// For production use, uncomment below and ensure inngest environment is configured

/*
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { functions } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: functions,
});
*/

// Fallback health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    service: "inngest-api",
    message: "Inngest endpoint available (using workflow SDK fallback)",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "Webhook received",
      data: body,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Invalid request",
    }, { status: 400 });
  }
}
