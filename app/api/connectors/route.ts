import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const userId = 'user_demo'
    const connectors = await NotificationService.getConnectors(userId)

    console.log('[v0] Fetched connectors for user:', userId)

    return NextResponse.json({
      success: true,
      connectors,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Failed to fetch connectors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connectors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, config, events } = body

    const connector = {
      id: uuidv4(),
      userId: 'user_demo',
      type,
      name: config.name,
      config: {
        ...config,
        // Mask sensitive data
        webhookUrl: config.webhookUrl?.substring(0, 20) + '***' || '',
      },
      events,
      isActive: true,
      secret: crypto.randomBytes(32).toString('hex'),
      createdAt: new Date(),
      lastTriggeredAt: null,
      failureCount: 0,
    }

    await NotificationService.storeConnector(connector)

    console.log('[v0] Connector created:', connector.id, type)

    return NextResponse.json({
      success: true,
      connector,
    })
  } catch (error) {
    console.error('[v0] Failed to create connector:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create connector' },
      { status: 500 }
    )
  }
}
