/**
 * Alert Stream API - Server-Sent Events for real-time alert updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 60 // 60 seconds timeout

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  const transactionId = request.nextUrl.searchParams.get('transactionId')
  const streamType = request.nextUrl.searchParams.get('type') || 'transaction' // 'transaction' or 'security'

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId' },
      { status: 400 }
    )
  }

  if (streamType === 'transaction' && !transactionId) {
    return NextResponse.json(
      { error: 'Missing transactionId for transaction stream' },
      { status: 400 }
    )
  }

  console.log('[v0] Alert stream started:', { userId, transactionId, streamType })

  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const supabase = createServiceClient()

      // Send initial connection message
      controller.enqueue(
        `data: ${JSON.stringify({
          id: `init_${Date.now()}`,
          type: 'connection',
          status: 'connected',
          timestamp: new Date().toISOString(),
        })}\n\n`
      )

      // Fetch initial alerts from database
      const { data: initialAlerts } = await supabase
        .from('transaction_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: true })

      if (initialAlerts && initialAlerts.length > 0) {
        for (const alert of initialAlerts) {
          controller.enqueue(
            `data: ${JSON.stringify({
              id: alert.id,
              transactionId: alert.transaction_id,
              type: alert.type,
              status: alert.status,
              timestamp: alert.sent_at || alert.created_at,
              description: alert.failure_reason,
            })}\n\n`
          )

          // Small delay between messages
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      // Subscribe to real-time changes based on stream type
      let channel

      if (streamType === 'security') {
        // Security events stream
        channel = supabase
          .channel(`security_alerts:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'security_events',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('[v0] Security alert received:', payload)

              const event = payload.new
              controller.enqueue(
                `data: ${JSON.stringify({
                  id: event.id,
                  type: 'security-event',
                  eventType: event.event_type,
                  severity: event.severity,
                  description: event.description,
                  ipAddress: event.ip_address,
                  timestamp: event.created_at,
                  actionUrl: getActionUrl(event.event_type),
                })}\n\n`
              )
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'sessions',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('[v0] New session detected:', payload)

              const session = payload.new
              controller.enqueue(
                `data: ${JSON.stringify({
                  id: session.id,
                  type: 'new-session',
                  device: session.device_name,
                  location: session.location,
                  ip: session.ip,
                  timestamp: session.created_at,
                  actionUrl: '/security/devices',
                })}\n\n`
              )
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'sessions',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (payload.new?.terminated_at) {
                console.log('[v0] Session terminated:', payload)

                controller.enqueue(
                  `data: ${JSON.stringify({
                    id: payload.new.id,
                    type: 'session-terminated',
                    device: payload.new.device_name,
                    timestamp: payload.new.terminated_at,
                    actionUrl: '/security/sessions',
                  })}\n\n`
                )
              }
            }
          )
          .subscribe((status) => {
            console.log('[v0] Security subscription status:', status)
          })
      } else {
        // Transaction alerts stream (existing)
        channel = supabase
          .channel(`transaction_alerts:${transactionId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'transaction_alerts',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('[v0] Alert update received:', payload)

              const alert = payload.new
              controller.enqueue(
                `data: ${JSON.stringify({
                  id: alert.id,
                  transactionId: alert.transaction_id,
                  type: alert.type,
                  status: alert.status,
                  timestamp: alert.sent_at || alert.created_at,
                  description: alert.failure_reason,
                })}\n\n`
              )
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'transaction_alerts',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('[v0] Alert status updated:', payload)

              const alert = payload.new
              controller.enqueue(
                `data: ${JSON.stringify({
                  id: alert.id,
                  transactionId: alert.transaction_id,
                  type: alert.type,
                  status: alert.status,
                  timestamp: alert.sent_at || alert.created_at,
                  description: alert.failure_reason,
                })}\n\n`
              )
            }
          )
          .subscribe((status) => {
            console.log('[v0] Subscription status:', status)
          })
      }

      // Close stream after 55 seconds
      const timeout = setTimeout(() => {
        console.log('[v0] Alert stream timeout')
        controller.close()
        channel.unsubscribe()
      }, 55000)

      // Handle cleanup
      return () => {
        clearTimeout(timeout)
        channel.unsubscribe()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

/**
 * Get action URL based on security event type
 */
function getActionUrl(eventType: string): string {
  const urls: Record<string, string> = {
    suspicious_login: '/security/verify-device',
    new_device: '/security/devices',
    password_changed: '/settings/security',
    two_factor_enabled: '/settings/security',
    session_terminated: '/security/sessions',
    failed_login: '/security/verify',
    impossible_travel: '/security/alert',
  }

  return urls[eventType] || '/security'
}
