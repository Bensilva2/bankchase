import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, bankName, accountLast4, itemId } = await request.json();

    if (!userId || !bankName || !itemId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, bankName, itemId" },
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

    const bankInfo = `${bankName}${accountLast4 ? ` (****${accountLast4})` : ""}`;

    // Update bank connection in Monday board
    const mutation = `
      mutation {
        change_column_value(
          item_id: ${itemId}
          column_id: "connected_bank"
          value: "${bankInfo}"
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
        { error: "Failed to update bank connection", details: data.errors },
        { status: 500 }
      );
    }

    // Update status to "Bank Connected"
    const statusMutation = `
      mutation {
        change_column_value(
          item_id: ${itemId}
          column_id: "status"
          value: "{\\"index\\": 2}"
        ) {
          id
        }
      }
    `;

    await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mondayApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: statusMutation }),
    });

    // Update onboarding step
    const stepMutation = `
      mutation {
        change_column_value(
          item_id: ${itemId}
          column_id: "onboarding_step"
          value: "{\\"index\\": 2}"
        ) {
          id
        }
      }
    `;

    await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mondayApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: stepMutation }),
    });

    return NextResponse.json({
      success: true,
      message: "Bank connection updated successfully",
    });
  } catch (error) {
    console.error("Error in update-bank endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
