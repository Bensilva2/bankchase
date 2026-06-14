'use client'

import { useState } from 'react'
import { DivvyDashboard } from '@/components/divvy-dashboard'
import { TikTokDashboard } from '@/components/tiktok-dashboard'
import { Bike, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const [activeApp, setActiveApp] = useState('divvy')

  return (
    <div className="w-full h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Bike className="w-6 h-6 text-primary" />
              </div>
              <span className="font-bold text-lg">Dashboard Hub</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveApp('divvy')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeApp === 'divvy'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              <Bike className="w-4 h-4" />
              Divvy Analytics
            </button>
            <button
              onClick={() => setActiveApp('tiktok')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeApp === 'tiktok'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              TikTok Ads
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeApp === 'divvy' ? <DivvyDashboard /> : <TikTokDashboard />}
      </div>
    </div>
  )
}
