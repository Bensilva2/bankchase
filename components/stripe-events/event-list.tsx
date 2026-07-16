'use client'

import { useState } from 'react'
import { StoredStripeEvent } from '@/lib/types/stripe-events'
import { CheckCircle, AlertCircle, Clock, XCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EventListProps {
  events: StoredStripeEvent[]
  onEventClick?: (event: StoredStripeEvent) => void
  onRetry?: (eventId: string) => void
}

export function EventList({ events, onEventClick, onRetry }: EventListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />
      case 'received':
        return <Clock className="w-5 h-5 text-blue-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
      case 'failed':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
      case 'processing':
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
      case 'received':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
    }
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-border rounded-lg">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">No events found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className={`border rounded-lg p-4 ${getStatusColor(event.status)} transition-all`}
        >
          <div
            className="flex items-center justify-between cursor-pointer hover:opacity-80"
            onClick={() => {
              setExpandedId(expandedId === event.id ? null : event.id)
              onEventClick?.(event)
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getStatusIcon(event.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground truncate">{event.eventType}</p>
                  <span className="text-xs px-2 py-1 rounded bg-background/50 text-muted-foreground">
                    {event.status}
                  </span>
                  {event.retryCount > 0 && (
                    <span className="text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                      Retry: {event.retryCount}/{5}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  ID: {event.eventId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(event.createdAt).toLocaleTimeString()}
              </p>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  expandedId === event.id ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {expandedId === event.id && (
            <div className="mt-4 pt-4 border-t border-current border-opacity-10 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Event ID</p>
                  <p className="font-mono text-foreground break-all">{event.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stripe Event ID</p>
                  <p className="font-mono text-foreground break-all">{event.eventId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="text-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
                {event.processedAt && (
                  <div>
                    <p className="text-muted-foreground">Processed</p>
                    <p className="text-foreground">
                      {new Date(event.processedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {event.error && (
                <div className="p-3 bg-background/50 rounded border border-current border-opacity-20">
                  <p className="text-xs font-medium text-destructive mb-1">Error</p>
                  <p className="text-xs text-destructive break-all">{event.error}</p>
                </div>
              )}

              {event.nextRetryAt && (
                <div className="p-3 bg-background/50 rounded border border-current border-opacity-20">
                  <p className="text-xs font-medium text-foreground mb-1">
                    Next Retry
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.nextRetryAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {event.status === 'failed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRetry?.(event.id)}
                  >
                    Retry Now
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(event.data, null, 2))
                  }}
                >
                  Copy JSON
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
