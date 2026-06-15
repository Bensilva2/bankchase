'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Copy, Pause, Play } from 'lucide-react'
import { biddingStrategies } from '@/lib/campaign-builder'

export function AdGroupManager() {
  const [adGroups, setAdGroups] = useState([
    {
      id: '1',
      name: 'Premium Headphones - Desktop',
      campaign: 'Summer Launch 2026',
      budget: 50,
      spent: 32.45,
      clicks: 245,
      impressions: 8234,
      ctr: 2.98,
      status: 'active' as const,
      bidding: 'target_cpc' as const,
    },
    {
      id: '2',
      name: 'Smart Watch - Mobile',
      campaign: 'Summer Launch 2026',
      budget: 75,
      spent: 64.20,
      clicks: 482,
      impressions: 12450,
      ctr: 3.87,
      status: 'active' as const,
      bidding: 'lowest_cost' as const,
    },
    {
      id: '3',
      name: 'Accessories Bundle',
      campaign: 'Q2 Sales Boost',
      budget: 40,
      spent: 18.50,
      clicks: 156,
      impressions: 5623,
      ctr: 2.77,
      status: 'paused' as const,
      bidding: 'target_roas' as const,
    },
  ])

  const [isCreating, setIsCreating] = useState(false)

  const toggleStatus = (id: string) => {
    setAdGroups(adGroups.map(g => 
      g.id === id ? { ...g, status: g.status === 'active' ? 'paused' : 'active' } : g
    ))
  }

  const deleteGroup = (id: string) => {
    setAdGroups(adGroups.filter(g => g.id !== id))
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Ad Groups</h2>
          <p className="text-muted-foreground">Manage and optimize your ad groups</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Ad Group
        </button>
      </div>

      {/* Create New Ad Group */}
      {isCreating && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Create Ad Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ad Group Name</label>
              <input
                type="text"
                placeholder="e.g., Premium Headphones - Desktop"
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign</label>
                <select className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground">
                  <option>Summer Launch 2026</option>
                  <option>Q2 Sales Boost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bidding Strategy</label>
                <select className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground">
                  {biddingStrategies.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Daily Budget ($)</label>
                <input
                  type="number"
                  placeholder="50.00"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Create Ad Group
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ad Groups Grid */}
      <div className="grid grid-cols-1 gap-4">
        {adGroups.map((group) => (
          <Card key={group.id} className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{group.name}</h3>
                    <Badge variant="secondary" className="text-xs">{group.campaign}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bidding: {biddingStrategies.find(s => s.value === group.bidding)?.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(group.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      group.status === 'active'
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    }`}
                  >
                    {group.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteGroup(group.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-6 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Budget</p>
                  <p className="font-semibold">${group.budget}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Spent</p>
                  <p className="font-semibold">${group.spent}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Clicks</p>
                  <p className="font-semibold">{group.clicks}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Impressions</p>
                  <p className="font-semibold">{group.impressions}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">CTR</p>
                  <p className="font-semibold text-primary">{group.ctr}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className={group.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    {group.status === 'active' ? 'Active' : 'Paused'}
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${(group.spent / group.budget) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{((group.spent / group.budget) * 100).toFixed(1)}% of budget used</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
