'use client'

import { useState, useEffect } from 'react'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { EventList } from '@/components/stripe-events/event-list'
import { EventStats } from '@/components/stripe-events/event-stats'
import { StoredStripeEvent } from '@/lib/types/stripe-events'
import { RefreshCw, Filter } from 'lucide-react'

function EventsDashboardContent() {
  
  const [events, setEvents] = useState<StoredStripeEvent[]>([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const fetchEvents = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      if (selectedType !== 'all') {
        params.append('eventType', selectedType)
      }

      params.append('limit', '100')

      const response = await fetch(`/api/stripe-events?${params.toString()}`)
      const data = await response.json()

      setEvents(data.events || [])
      setStats(data.stats)
    } catch (error) {
      console.error('[v0] Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && userId) {
      fetchEvents()
    }
  }, [isLoaded, userId, selectedStatus, selectedType])

  const handleRetry = async (eventId: string) => {
    try {
      const response = await fetch(`/api/stripe-events/${eventId}/retry`, {
        method: 'POST',
      })

      if (response.ok) {
        // Refresh events
        fetchEvents()
      }
    } catch (error) {
      console.error('[v0] Error retrying event:', error)
    }
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <Navigation />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Stripe Events</h1>
          <p className="text-muted-foreground">
            Monitor and manage Stripe events from Azure Event Grid
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <EventStats stats={stats} loading={loading} />
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              >
                <option value="all">All Status</option>
                <option value="received">Received</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Event Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              >
                <option value="all">All Types</option>
                <option value="charge.succeeded">Charge Succeeded</option>
                <option value="charge.failed">Charge Failed</option>
                <option value="invoice.paid">Invoice Paid</option>
                <option value="payment_intent.succeeded">Payment Intent Succeeded</option>
                <option value="customer.created">Customer Created</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => fetchEvents()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Events</h2>
          <EventList
            events={events}
            onRetry={handleRetry}
          />
        </div>
      </div>
    </main>
  )
}

export default function EventsDashboardPage() {
  return (
    <ProtectedRoute>
      <EventsDashboardContent />
    </ProtectedRoute>
  )
}
