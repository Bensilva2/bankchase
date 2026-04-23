/**
 * SMS Notification API - Sends SMS alerts to all registered devices
 * Supports both single recipient and multi-device delivery
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { userId, phone, message, type, data, broadcastToDevices } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message required' },
        { status: 400 }
      )
    }

    const messageId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    let smsResults: any[] = []

    // If broadcastToDevices is true, send to all devices
    if (broadcastToDevices && userId) {
      const { data: devices } = await supabase
        .from('device_registrations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (devices && devices.length > 0) {
        // Send SMS to user's phone
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, '')
          if (cleanPhone.length >= 10) {
            const smsResult = await sendSMS(cleanPhone, message)
            smsResults.push({
              device: 'sms',
              phone: cleanPhone,
              ...smsResult,
            })
          }
        }

        // Log notification to all devices
        for (const device of devices) {
          await supabase.from('notification_logs').insert([
            {
              id: crypto.randomUUID(),
              user_id: userId,
              device_id: device.device_id,
              type: type || 'sms',
              title: data?.title || 'Notification',
              message,
              data,
              status: 'sent',
              created_at: timestamp,
            },
          ])
        }
      }
    } else if (phone) {
      // Single phone number SMS
      const cleanPhone = phone.replace(/\D/g, '')
      if (cleanPhone.length < 10) {
        return NextResponse.json(
          { error: 'Invalid phone number' },
          { status: 400 }
        )
      }

      const smsResult = await sendSMS(cleanPhone, message)
      smsResults.push(smsResult)

      // Log SMS if user ID provided
      if (userId) {
        await supabase.from('notification_logs').insert([
          {
            id: messageId,
            user_id: userId,
            device_id: null,
            type: 'sms',
            title: data?.title || 'SMS Alert',
            message,
            data,
            status: 'sent',
            created_at: timestamp,
          },
        ])
      }
    }

    console.log('[v0] SMS notifications sent:', {
      userId,
      messageId,
      deviceCount: broadcastToDevices ? 'all' : '1',
      results: smsResults,
    })

    return NextResponse.json({
      success: true,
      message: 'SMS notifications queued',
      messageId,
      deliveryResults: smsResults,
      timestamp,
    })
  } catch (error) {
    console.error('[v0] SMS notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send SMS notification' },
      { status: 500 }
    )
  }
}

async function sendSMS(phone: string, message: string) {
  // In production, integrate with Twilio, AWS SNS, MessageBird, etc.
  // Example: const response = await twilioClient.messages.create({
  //   to: phone,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   body: message,
  // })

  // Simulate SMS service delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  const smsId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  console.log('[v0] SMS queued:', {
    to: phone.slice(-4),
    body: message,
    smsId,
  })

  return {
    success: true,
    phone,
    messageId: smsId,
    status: 'queued',
    timestamp: new Date().toISOString(),
  }
}
