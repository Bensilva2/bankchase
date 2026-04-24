import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, balance, itemId } = await request.json();

    if (!userId || balance === undefined || !itemId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, balance, itemId" },
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

    // Update item balance in Monday board
    const mutation = `
      mutation {
        change_column_value(
          item_id: ${itemId}
          column_id: "balance"
          value: "${balance}"
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
        { error: "Failed to update balance", details: data.errors },
        { status: 500 }
      );
    }

    // Update status to "First Deposit" if balance > 0
    if (balance > 0) {
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
    }

    return NextResponse.json({
      success: true,
      message: "Balance updated successfully",
    });
  } catch (error) {
    console.error("Error in update-balance endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
