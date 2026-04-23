import { NextRequest, NextResponse } from 'next/server'

// In-memory event store for device activities
const deviceEvents: Array<{
  id: string
  type: 'login' | 'logout' | 'activity' | 'trust_change' | 'rename' | 'location_change'
  deviceId: string
  deviceName: string
  message: string
  timestamp: string
  metadata?: Record<string, any>
}> = []

// Initialize with some demo events
const initializeDemoEvents = () => {
  if (deviceEvents.length === 0) {
    const now = Date.now()
    deviceEvents.push(
      {
        id: 'evt_1',
        type: 'login',
        deviceId: 'dev1',
        deviceName: 'iPhone 15 Pro Max',
        message: 'New login from iPhone 15 Pro Max',
        timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
        metadata: { location: 'New York, NY', ip: '192.168.1.105' }
      },
      {
        id: 'evt_2',
        type: 'activity',
        deviceId: 'dev2',
        deviceName: 'MacBook Pro 16"',
        message: 'Session refreshed on MacBook Pro 16"',
        timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
        metadata: { location: 'New York, NY', ip: '192.168.1.102' }
      },
      {
        id: 'evt_3',
        type: 'trust_change',
        deviceId: 'dev1',
        deviceName: 'iPhone 15 Pro Max',
        message: 'Device marked as trusted',
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      }
    )
  }
}

export async function GET(request: NextRequest) {
  initializeDemoEvents()

  const { searchParams } = new URL(request.url)
  const since = searchParams.get('since')
  const deviceId = searchParams.get('deviceId')
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  let filteredEvents = [...deviceEvents]

  // Filter by timestamp if provided
  if (since) {
    const sinceTime = new Date(since).getTime()
    filteredEvents = filteredEvents.filter(e => new Date(e.timestamp).getTime() > sinceTime)
  }

  // Filter by device if provided
  if (deviceId) {
    filteredEvents = filteredEvents.filter(e => e.deviceId === deviceId)
  }

  // Sort by timestamp descending and limit
  filteredEvents = filteredEvents
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)

  return NextResponse.json({
    success: true,
    events: filteredEvents,
    total: filteredEvents.length,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  initializeDemoEvents()

  try {
    const body = await request.json()
    const { type, deviceId, deviceName, message, metadata } = body

    if (!type || !deviceId || !deviceName) {
      return NextResponse.json(
        { error: 'Missing required fields: type, deviceId, deviceName' },
        { status: 400 }
      )
    }

    const newEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      deviceId,
      deviceName,
      message: message || `${type} event from ${deviceName}`,
      timestamp: new Date().toISOString(),
      metadata
    }

    // Add to beginning of array (most recent first)
    deviceEvents.unshift(newEvent)

    // Keep only last 1000 events
    if (deviceEvents.length > 1000) {
      deviceEvents.pop()
    }

    return NextResponse.json({
      success: true,
      event: newEvent,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[v0] Device event creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
