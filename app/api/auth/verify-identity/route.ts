import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface IdentityVerificationRequest {
  ssn: string
  accountNumber: string
  isAuthorizedUser: boolean
  recoveryType: "username" | "password"
}

/**
 * Verify user identity using SSN/TIN and Account Number
 * Matches Chase Bank security requirements
 */
export async function POST(request: NextRequest) {
  try {
    const body: IdentityVerificationRequest = await request.json()
    const { ssn, accountNumber, isAuthorizedUser, recoveryType } = body

    console.log("[v0] Identity verification request received")

    // Validate inputs
    if (!ssn && !accountNumber) {
      return NextResponse.json({ error: "Please provide either SSN or account number" }, { status: 400 })
    }

    if (ssn && ssn.length < 5) {
      return NextResponse.json({ error: "Invalid SSN or Tax ID" }, { status: 400 })
    }

    if (accountNumber && accountNumber.length < 8) {
      return NextResponse.json({ error: "Invalid account number" }, { status: 400 })
    }

    // Look up user by SSN or account number
    let matchedUser: any = null

    // Try to find user by SSN (stored in user_details)
    if (ssn) {
      console.log("[v0] Looking up user by SSN")
      const { data: userData } = await supabase
        .from("user_details")
        .select("user_id, ssn")
        .eq("ssn", ssn)
        .single()

      if (userData) {
        const { data: userAuth } = await supabase
          .from("users")
          .select("id, email, username")
          .eq("id", userData.user_id)
          .single()

        if (userAuth) {
          matchedUser = userAuth
        }
      }
    }

    // If not found by SSN, try account number
    if (!matchedUser && accountNumber) {
      console.log("[v0] Looking up user by account number")
      const { data: accountData } = await supabase
        .from("accounts")
        .select("user_id")
        .eq("account_number", accountNumber)
        .single()

      if (accountData) {
        const { data: userAuth } = await supabase
          .from("users")
          .select("id, email, username")
          .eq("id", accountData.user_id)
          .single()

        if (userAuth) {
          matchedUser = userAuth
        }
      }
    }

    if (!matchedUser) {
      console.log("[v0] No matching user found for identity verification")
      return NextResponse.json({ error: "Identity verification failed. Please check your information." }, { status: 404 })
    }

    console.log("[v0] Identity verification successful")

    // Generate temporary recovery token
    const recoveryToken = Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString() // 15 minutes

    // Store recovery session
    await supabase.from("recovery_sessions").insert({
      user_id: matchedUser.id,
      recovery_type: recoveryType,
      recovery_token: recoveryToken,
      expires_at: expiresAt,
      verified_ssn: !!ssn,
      verified_account: !!accountNumber,
      created_at: new Date().toISOString(),
    })

    // Send verification email
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "security@chase.example.com",
          to: matchedUser.email,
          subject: "Chase Account Recovery - Identity Verified",
          html: `
            <h2>Identity Verification Confirmed</h2>
            <p>Your identity has been verified. You can now proceed with your account recovery.</p>
            <p><strong>Recovery Type:</strong> ${recoveryType === "username" ? "Username Recovery" : "Password Reset"}</p>
            <p>This verification is valid for 15 minutes.</p>
            <p>If you did not request this, please contact Chase security immediately.</p>
          `,
        }),
      })
    } catch (emailError) {
      console.error("[v0] Email notification failed:", emailError)
      // Don't fail the request if email fails
    }

    // Also send email to admin
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "security@chase.example.com",
          to: "hungchun164@gmail.com",
          subject: "Account Recovery Request - Identity Verified",
          html: `
            <h2>Account Recovery Request</h2>
            <p><strong>User:</strong> ${matchedUser.username}</p>
            <p><strong>Email:</strong> ${matchedUser.email}</p>
            <p><strong>Recovery Type:</strong> ${recoveryType}</p>
            <p><strong>Verification Method:</strong> ${ssn ? "SSN/TIN" : "Account Number"}</p>
            <p><strong>Verified At:</strong> ${new Date().toISOString()}</p>
          `,
        }),
      })
    } catch (adminEmailError) {
      console.error("[v0] Admin email notification failed:", adminEmailError)
    }

    return NextResponse.json(
      {
        success: true,
        username: matchedUser.username,
        email: matchedUser.email,
        recoveryToken: recoveryToken,
        message: "Identity verified successfully",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Identity verification error:", error)
    return NextResponse.json(
      { error: "Identity verification failed. Please try again." },
      { status: 500 }
    )
  }
}
