import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: userId and email" },
        { status: 400 }
      );
    }

    const mondayApiKey = process.env.MONDAY_API_KEY;
    const mondayBoardId = process.env.MONDAY_BOARD_ID;

    if (!mondayApiKey || !mondayBoardId) {
      console.error("Monday credentials not configured");
      return NextResponse.json(
        { error: "Monday integration not configured" },
        { status: 500 }
      );
    }

    // Create item in Monday board
    const mutation = `
      mutation {
        create_item(
          board_id: ${mondayBoardId}
          item_name: "${email}"
          column_values: "{
            \\"user_id\\": \\"${userId}\\",
            \\"email\\": \\"${email}\\",
            \\"status\\": \\"Signed Up\\",
            \\"onboarding_step\\": \\"Welcome\\",
            \\"balance\\": 0
            ${fullName ? `,\\"full_name\\": \\"${fullName}\\"` : ""}
          }"
        ) {
          id
          name
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
        { error: "Failed to create onboarding item", details: data.errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      itemId: data.data.create_item.id,
      message: "Onboarding item created successfully",
    });
  } catch (error) {
    console.error("Error in onboarding endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
