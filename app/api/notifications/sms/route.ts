/**
 * SMS Notification API - Sends SMS alerts
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, phone, message } = await request.json()

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate phone number format
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    console.log('[v0] Processing SMS notification:', {
      userId,
      phone: cleanPhone.slice(-4),
      message,
    })

    // In production, integrate with SMS service (Twilio, AWS SNS, MessageBird, etc.)
    // Example: await twilioClient.messages.create({ to: phone, from: '+...', body: message })

    // Simulate SMS service delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Log SMS details
    console.log('[v0] SMS sent:', {
      to: cleanPhone,
      body: message,
      timestamp: new Date().toISOString(),
    })

    // Simulate success response
    return NextResponse.json({
      success: true,
      message: 'SMS queued for delivery',
      phone: cleanPhone,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'queued',
    })
  } catch (error) {
    console.error('[v0] SMS notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send SMS notification' },
      { status: 500 }
    )
  }
}
