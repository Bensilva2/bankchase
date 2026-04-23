/**
 * Alert Stream API - Server-Sent Events for real-time alert updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60 // 60 seconds timeout

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  const transactionId = request.nextUrl.searchParams.get('transactionId')

  if (!userId || !transactionId) {
    return NextResponse.json(
      { error: 'Missing userId or transactionId' },
      { status: 400 }
    )
  }

  console.log('[v0] Alert stream started:', { userId, transactionId })

  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const supabase = await createClient()

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

      // Subscribe to real-time changes
      const channel = supabase
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
