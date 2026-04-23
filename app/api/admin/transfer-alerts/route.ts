/**
 * Admin Transfer Alerts API - Send multi-channel alerts for fund transfers
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendAdminTransferAlert } from '@/lib/admin-transfer-alert-service'

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      userPhone,
      userEmail,
      recipientName,
      amount,
      accountName,
      transferId,
      broadcastToAllDevices,
    } = await request.json()

    // Validate required fields
    if (!userId || !amount || !accountName || !transferId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[v0] Processing transfer alerts:', {
      userId,
      amount,
      transferId,
    })

    // Send multi-channel alerts
    const { success, results } = await sendAdminTransferAlert({
      userId,
      userPhone,
      userEmail,
      recipientName: recipientName || 'Chase Bank',
      amount,
      accountName,
      transferId,
      broadcastToAllDevices: broadcastToAllDevices !== false,
    })

    // Track alert delivery
    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    console.log('[v0] Transfer alerts processed:', {
      transferId,
      totalChannels: results.length,
      successCount,
      failureCount,
      channels: results.map((r) => r.channel),
    })

    return NextResponse.json({
      success,
      message: `Transfer alert sent via ${successCount} channel(s)`,
      transferId,
      amount,
      alerts: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Transfer alerts API error:', error)
    return NextResponse.json(
      { error: 'Failed to send transfer alerts' },
      { status: 500 }
    )
  }
}
