import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { itemId, status, statusIndex } = await request.json();

    if (!itemId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: itemId, status" },
        { status: 400 }
      );
    }

    const mondayApiKey = process.env.MONDAY_API_KEY;

    if (!mondayApiKey) {
      console.error("Monday API key not configured");
      return NextResponse.json(
        { error: "Monday integration not configured" },
        { status: 500 }
      );
    }

    // Update status in Monday board
    const mutation = `
      mutation {
        change_column_value(
          item_id: ${itemId}
          column_id: "status"
          value: "{\\"index\\": ${statusIndex || 0}}"
        ) {
          id
        }
      }
    `;

    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mondayApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: mutation }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error("Monday API error:", data.errors);
      return NextResponse.json(
        { error: "Failed to update status", details: data.errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Status updated to ${status}`,
    });
  } catch (error) {
    console.error("Error in update-status endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
