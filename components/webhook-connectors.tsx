'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, AlertCircle, Zap, Settings } from 'lucide-react'
import { connectorTypes, WebhookEventType } from '@/lib/notifications'

export function WebhookConnectors() {
  const [connectors, setConnectors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>([])

  useEffect(() => {
    fetchConnectors()
  }, [])

  async function fetchConnectors() {
    try {
      setLoading(true)
      const response = await fetch('/api/connectors')
      const data = await response.json()
      setConnectors(data.connectors || [])
    } catch (error) {
      console.error('[v0] Failed to fetch connectors:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateConnector(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          config: formData,
          events: selectedEvents,
        }),
      })

      if (response.ok) {
        await fetchConnectors()
        setSelectedType(null)
        setFormData({})
        setSelectedEvents([])
      }
    } catch (error) {
      console.error('[v0] Failed to create connector:', error)
    }
  }

  async function handleDeleteConnector(connectorId: string) {
    try {
      const response = await fetch(`/api/connectors/${connectorId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchConnectors()
      }
    } catch (error) {
      console.error('[v0] Failed to delete connector:', error)
    }
  }

  const events: WebhookEventType[] = [
    'transaction.completed',
    'transaction.failed',
    'balance.low',
    'fraud.detected',
    'account.updated',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Webhook Connectors</h2>
        <p className="text-muted-foreground">Connect to third-party services for real-time banking notifications</p>
      </div>

      {/* Existing Connectors */}
      <div className="grid gap-4">
        {connectors.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/50 rounded-lg">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground">No connectors configured yet</p>
          </div>
        ) : (
          connectors.map((connector) => (
            <div key={connector.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{connectorTypes[connector.type as keyof typeof connectorTypes]?.icon}</span>
                  <div>
                    <h3 className="font-semibold">{connector.name}</h3>
                    <p className="text-sm text-muted-foreground">{connectorTypes[connector.type as keyof typeof connectorTypes]?.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteConnector(connector.id)}
                  className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                  title="Delete connector"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {connector.isActive ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-sm">{connector.isActive ? 'Active' : 'Inactive'}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {connector.events.map((event) => (
                    <span key={event} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create New Connector */}
      {!selectedType ? (
        <div>
          <button
            onClick={() => setSelectedType('slack')}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Connector
          </button>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
            {Object.entries(connectorTypes).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <div className="font-semibold text-sm">{type.name}</div>
                <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Create {connectorTypes[selectedType as keyof typeof connectorTypes]?.name} Connector</h3>
            <button
              onClick={() => setSelectedType(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateConnector} className="space-y-6">
            {/* Connector Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Connector Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Sales Alerts"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Dynamic Fields Based on Type */}
            {connectorTypes[selectedType as keyof typeof connectorTypes]?.fields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-2 capitalize">
                  {field.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type={field.includes('url') ? 'url' : field.includes('email') ? 'email' : field.includes('phone') ? 'tel' : 'text'}
                  required
                  placeholder={`Enter ${field}`}
                  value={formData[field] || ''}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}

            {/* Event Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Events to Send</label>
              <div className="grid grid-cols-1 gap-2">
                {events.map((event) => (
                  <label key={event} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents([...selectedEvents, event])
                        } else {
                          setSelectedEvents(selectedEvents.filter((e) => e !== event))
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={selectedEvents.length === 0}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Connector
              </button>
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
