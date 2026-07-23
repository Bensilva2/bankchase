import { NextRequest, NextResponse } from "next/server";
import { getWorkflowStatus } from "@/lib/workflow-client";

export async function GET(request: NextRequest) {
  try {
    const workflowRunId = request.nextUrl.searchParams.get("runId");

    if (!workflowRunId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing runId parameter",
        },
        { status: 400 }
      );
    }

    const status = await getWorkflowStatus(workflowRunId);

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: "Workflow not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Error fetching status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
