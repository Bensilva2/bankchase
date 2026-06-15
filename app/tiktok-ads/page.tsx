'use client'

import { useState } from 'react'
import { TikTokDashboard } from '@/components/tiktok-dashboard'
import { CampaignBuilderWizard } from '@/components/campaign-builder-wizard'
import { AdGroupManager } from '@/components/ad-group-manager'
import { CatalogManager } from '@/components/catalog-manager'
import { Zap, Target, Package, Plus } from 'lucide-react'

export default function TikTokAdsPage() {
  const [activeView, setActiveView] = useState('overview')

  const views = [
    { id: 'overview', label: 'Overview', icon: Zap },
    { id: 'campaigns', label: 'Campaigns', icon: Target },
    { id: 'ad-groups', label: 'Ad Groups', icon: Target },
    { id: 'catalogs', label: 'Catalogs', icon: Package },
    { id: 'create', label: 'Create Campaign', icon: Plus },
  ]

  return (
    <div className="w-full h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">TikTok Ads Manager</h1>
          </div>
          
          {/* View Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {views.map((view) => {
              const IconComponent = view.icon
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    activeView === view.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {view.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {activeView === 'overview' && <TikTokDashboard />}
            {activeView === 'campaigns' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Campaigns</h2>
                  <p className="text-muted-foreground">Manage your TikTok Ads campaigns</p>
                </div>
                <TikTokDashboard />
              </div>
            )}
            {activeView === 'ad-groups' && <AdGroupManager />}
            {activeView === 'catalogs' && <CatalogManager />}
            {activeView === 'create' && <CampaignBuilderWizard />}
          </div>
        </div>
      </div>
    </div>
  )
}
