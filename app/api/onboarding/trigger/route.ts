import { NextRequest, NextResponse } from "next/server";
import { triggerOnboardingWorkflow } from "@/lib/workflow-client";

export async function POST(request: NextRequest) {
  try {
    const result = await triggerOnboardingWorkflow();

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          workflowRunId: result.workflowRunId,
          message: result.message,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API] Error in trigger endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
