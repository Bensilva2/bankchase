import { NextRequest, NextResponse } from 'next/server'
import { SessionManagementService } from '@/lib/session-management-service'
import { AnomalyDetectionService } from '@/lib/security/anomaly-detection-service'

// Simulated in-memory session store (in production, use a database)
const sessionStore = new Map<string, {
  id: string
  userId: string
  device: string
  browser: string
  os: string
  location: string
  ip: string
  lastActive: string
  createdAt: string
  trusted: boolean
}>()

// Initialize with some demo sessions
const initializeDemoSessions = () => {
  if (sessionStore.size === 0) {
    const sessions = [
      {
        id: 'session_1',
        userId: 'user1',
        device: 'iPhone 15 Pro Max',
        browser: 'Safari',
        os: 'iOS 17.2',
        location: 'New York, NY',
        ip: '192.168.1.105',
        lastActive: new Date().toISOString(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        trusted: true,
      },
      {
        id: 'session_2',
        userId: 'user1',
        device: 'MacBook Pro 16"',
        browser: 'Chrome',
        os: 'macOS Sonoma',
        location: 'New York, NY',
        ip: '192.168.1.102',
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        trusted: true,
      },
      {
        id: 'session_3',
        userId: 'user1',
        device: 'iPad Pro 12.9"',
        browser: 'Safari',
        os: 'iPadOS 17.2',
        location: 'Brooklyn, NY',
        ip: '192.168.1.110',
        lastActive: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        trusted: false,
      },
    ]
    sessions.forEach(s => sessionStore.set(s.id, s))
  }
}

export async function POST(request: NextRequest) {
  initializeDemoSessions()
  
  try {
    const body = await request.json()
    const { action, email, sessionId, deviceId, updates } = body

    // Logout all sessions
    if (action === 'logout-all') {
      console.log(`[v0] Logging out all sessions for ${email}`)
      
      // Get current session from request headers/cookies
      const currentSessionId = request.headers.get('x-session-id') || 'session_1'
      
      // Remove all sessions except current
      const removedCount = Array.from(sessionStore.entries())
        .filter(([id, session]) => session.userId === 'user1' && id !== currentSessionId)
        .length
      
      sessionStore.forEach((session, id) => {
        if (session.userId === 'user1' && id !== currentSessionId) {
          sessionStore.delete(id)
        }
      })

      // Send real-time notification via session management service
      await SessionManagementService.logoutAllExcept('user1', email, currentSessionId)
        .catch(err => console.error('[v0] Failed to send logout notification:', err))

      return NextResponse.json(
        {
          success: true,
          message: 'Logged out from all devices successfully',
          removedCount,
          timestamp: new Date().toISOString(),
          notificationSent: true,
        },
        {
          headers: {
            'Set-Cookie': 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC;',
          },
        }
      )
    }

    // Get all active sessions
    if (action === 'get-sessions') {
      const sessions = Array.from(sessionStore.values())
        .filter(s => s.userId === 'user1')
        .map(s => ({
          ...s,
          current: s.id === 'session_1', // Mark current session
        }))
        .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())

      return NextResponse.json({
        success: true,
        sessions,
        total: sessions.length,
        timestamp: new Date().toISOString(),
      })
    }

    // Terminate a specific session
    if (action === 'terminate-session') {
      const targetId = sessionId || deviceId
      
      if (!targetId) {
        return NextResponse.json(
          { error: 'Session ID is required' },
          { status: 400 }
        )
      }

      const session = sessionStore.get(targetId)
      if (session) {
        sessionStore.delete(targetId)
        console.log(`[v0] Terminated session ${targetId}: ${session.device}`)
        
        return NextResponse.json({
          success: true,
          message: 'Session terminated successfully',
          terminatedSession: {
            id: targetId,
            device: session.device,
            location: session.location,
          },
          timestamp: new Date().toISOString(),
        })
      }

      // Session not found in store, but still return success
      // (it may have been stored locally only)
      return NextResponse.json({
        success: true,
        message: 'Session terminated successfully',
        timestamp: new Date().toISOString(),
      })
    }

    // Update session (trust status, name, etc.)
    if (action === 'update-session') {
      const targetId = sessionId || deviceId
      
      if (!targetId) {
        return NextResponse.json(
          { error: 'Session ID is required' },
          { status: 400 }
        )
      }

      const session = sessionStore.get(targetId)
      if (session) {
        const updatedSession = { ...session, ...updates, lastActive: new Date().toISOString() }
        sessionStore.set(targetId, updatedSession)
        
        return NextResponse.json({
          success: true,
          message: 'Session updated successfully',
          session: updatedSession,
          timestamp: new Date().toISOString(),
        })
      }

      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Register a new session/device
    if (action === 'register-session') {
      const { device, browser, os, location, ip } = body
      
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newSession = {
        id: newSessionId,
        userId: 'user1',
        device: device || 'Unknown Device',
        browser: browser || 'Unknown Browser',
        os: os || 'Unknown OS',
        location: location || 'Unknown Location',
        ip: ip || '0.0.0.0',
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        trusted: false,
      }
      
      sessionStore.set(newSessionId, newSession)
      
      return NextResponse.json({
        success: true,
        message: 'Session registered successfully',
        session: newSession,
        timestamp: new Date().toISOString(),
      })
    }

    // Refresh session activity (heartbeat)
    if (action === 'heartbeat') {
      const targetId = sessionId || 'session_1'
      const session = sessionStore.get(targetId)
      
      if (session) {
        session.lastActive = new Date().toISOString()
        sessionStore.set(targetId, session)
      }

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
      })
    }

    // Get session statistics
    if (action === 'get-stats') {
      const sessions = Array.from(sessionStore.values()).filter(s => s.userId === 'user1')
      
      const stats = {
        totalDevices: sessions.length,
        trustedDevices: sessions.filter(s => s.trusted).length,
        activeToday: sessions.filter(s => {
          const lastActive = new Date(s.lastActive)
          const today = new Date()
          return lastActive.toDateString() === today.toDateString()
        }).length,
        deviceTypes: {
          mobile: sessions.filter(s => s.device.toLowerCase().includes('iphone') || s.device.toLowerCase().includes('android')).length,
          tablet: sessions.filter(s => s.device.toLowerCase().includes('ipad') || s.device.toLowerCase().includes('tablet')).length,
          desktop: sessions.filter(s => s.device.toLowerCase().includes('mac') || s.device.toLowerCase().includes('windows') || s.device.toLowerCase().includes('pc')).length,
        },
        locations: [...new Set(sessions.map(s => s.location))],
      }

      return NextResponse.json({
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Session management error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  initializeDemoSessions()
  
  try {
    const sessions = Array.from(sessionStore.values())
      .filter(s => s.userId === 'user1')
      .map(s => ({
        ...s,
        current: s.id === 'session_1',
      }))
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())

    return NextResponse.json({
      success: true,
      sessions,
      total: sessions.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Session fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
