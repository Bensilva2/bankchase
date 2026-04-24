import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-supabase-signature") || "";

    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    // Verify signature
    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);

    // Handle user signup event
    if (event.type === "INSERT" && event.table === "auth.users") {
      const { id: userId, email } = event.record;

      console.log(`[v0] New user signup: ${email}`);

      // Call the Monday onboarding API
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const onboardingResponse = await fetch(
        `${baseUrl}/api/monday/onboarding`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            email,
            fullName: event.record.user_metadata?.full_name || "",
          }),
        }
      );

      if (!onboardingResponse.ok) {
        console.error("Failed to create Monday onboarding item");
        // Don't fail the webhook - user signup should complete even if Monday fails
      }

      return NextResponse.json({ success: true });
    }

    // Handle user profile update
    if (event.type === "UPDATE" && event.table === "profiles") {
      console.log(`[v0] Profile updated for user: ${event.record.id}`);
      // You can add logic here to update Monday status to "Profile Complete"
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
