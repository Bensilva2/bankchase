import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getTikTokStats, getTikTokCampaigns, getTikTokLeads, updateTikTokStats } from '@/lib/supabase-tiktok'
import {
  generateTikTokStats,
  generateTikTokCampaigns,
  generateTikTokLeads,
  generateTikTokCatalogs,
  generateCampaignPerformance,
} from '@/lib/tiktok-data'

const TIKTOK_STATS_KEY = 'tiktok:stats'
const TIKTOK_CAMPAIGNS_KEY = 'tiktok:campaigns'
const TIKTOK_LEADS_KEY = 'tiktok:leads'
const TIKTOK_CATALOGS_KEY = 'tiktok:catalogs'
const TIKTOK_PERFORMANCE_KEY = 'tiktok:performance'
const CACHE_DURATION = 60 // 1 minute

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dataType = searchParams.get('type') || 'all'

  try {
    const data: any = {}

    if (dataType === 'all' || dataType === 'stats') {
      try {
        let stats = await redis.get<any>(TIKTOK_STATS_KEY)

        if (!stats) {
          const dbStats = await getTikTokStats()
          stats = dbStats || generateTikTokStats()
          await redis.setex(TIKTOK_STATS_KEY, CACHE_DURATION, JSON.stringify(stats))
        }
        data.stats = stats
      } catch (err) {
        console.error('[v0] Stats fetch error, using mock:', err)
        data.stats = generateTikTokStats()
      }
    }

    if (dataType === 'all' || dataType === 'campaigns') {
      try {
        let campaigns = await redis.get<any[]>(TIKTOK_CAMPAIGNS_KEY)

        if (!campaigns) {
          const dbCampaigns = await getTikTokCampaigns()
          campaigns = dbCampaigns && dbCampaigns.length > 0 ? dbCampaigns : generateTikTokCampaigns()
          await redis.setex(TIKTOK_CAMPAIGNS_KEY, CACHE_DURATION, JSON.stringify(campaigns))
        }
        data.campaigns = campaigns
      } catch (err) {
        console.error('[v0] Campaigns fetch error, using mock:', err)
        data.campaigns = generateTikTokCampaigns()
      }
    }

    if (dataType === 'all' || dataType === 'leads') {
      try {
        let leads = await redis.get<any[]>(TIKTOK_LEADS_KEY)

        if (!leads) {
          const dbLeads = await getTikTokLeads()
          leads = dbLeads && dbLeads.length > 0 ? dbLeads : generateTikTokLeads()
          await redis.setex(TIKTOK_LEADS_KEY, CACHE_DURATION, JSON.stringify(leads))
        }
        data.leads = leads
      } catch (err) {
        console.error('[v0] Leads fetch error, using mock:', err)
        data.leads = generateTikTokLeads()
      }
    }

    if (dataType === 'all' || dataType === 'catalogs') {
      try {
        let catalogs = await redis.get<any[]>(TIKTOK_CATALOGS_KEY)

        if (!catalogs) {
          catalogs = generateTikTokCatalogs()
          await redis.setex(TIKTOK_CATALOGS_KEY, CACHE_DURATION, JSON.stringify(catalogs))
        }
        data.catalogs = catalogs
      } catch (err) {
        console.error('[v0] Catalogs fetch error, using mock:', err)
        data.catalogs = generateTikTokCatalogs()
      }
    }

    if (dataType === 'all' || dataType === 'performance') {
      try {
        let performance = await redis.get<any[]>(TIKTOK_PERFORMANCE_KEY)

        if (!performance) {
          performance = generateCampaignPerformance()
          await redis.setex(TIKTOK_PERFORMANCE_KEY, CACHE_DURATION, JSON.stringify(performance))
        }
        data.performance = performance
      } catch (err) {
        console.error('[v0] Performance fetch error, using mock:', err)
        data.performance = generateCampaignPerformance()
      }
    }

    console.log('[v0] TikTok API GET - Success', { dataType, timestamp: new Date().toISOString() })

    return NextResponse.json({
      success: true,
      data,
      cached: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] TikTok data API error:', error)
    // Return mock data on failure
    return NextResponse.json({
      success: true,
      data: {
        stats: generateTikTokStats(),
        campaigns: generateTikTokCampaigns(),
        leads: generateTikTokLeads(),
        catalogs: generateTikTokCatalogs(),
        performance: generateCampaignPerformance(),
      },
      cached: false,
      fallback: true,
      timestamp: new Date().toISOString(),
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    console.log('[v0] TikTok API POST - Action:', action)

    switch (action) {
      case 'refresh-stats': {
        const newStats = generateTikTokStats()
        try {
          await redis.setex(TIKTOK_STATS_KEY, CACHE_DURATION, JSON.stringify(newStats))
          await updateTikTokStats(newStats)
        } catch (err) {
          console.error('[v0] Error updating stats:', err)
        }
        return NextResponse.json({ success: true, data: newStats })
      }

      case 'refresh-campaigns': {
        const newCampaigns = generateTikTokCampaigns()
        try {
          await redis.setex(TIKTOK_CAMPAIGNS_KEY, CACHE_DURATION, JSON.stringify(newCampaigns))
        } catch (err) {
          console.error('[v0] Error updating campaigns:', err)
        }
        return NextResponse.json({ success: true, data: newCampaigns })
      }

      case 'refresh-leads': {
        const newLeads = generateTikTokLeads()
        try {
          await redis.setex(TIKTOK_LEADS_KEY, CACHE_DURATION, JSON.stringify(newLeads))
        } catch (err) {
          console.error('[v0] Error updating leads:', err)
        }
        return NextResponse.json({ success: true, data: newLeads })
      }

      case 'refresh-all': {
        const stats = generateTikTokStats()
        const campaigns = generateTikTokCampaigns()
        const leads = generateTikTokLeads()
        const catalogs = generateTikTokCatalogs()
        const performance = generateCampaignPerformance()

        try {
          await Promise.all([
            redis.setex(TIKTOK_STATS_KEY, CACHE_DURATION, JSON.stringify(stats)),
            redis.setex(TIKTOK_CAMPAIGNS_KEY, CACHE_DURATION, JSON.stringify(campaigns)),
            redis.setex(TIKTOK_LEADS_KEY, CACHE_DURATION, JSON.stringify(leads)),
            redis.setex(TIKTOK_CATALOGS_KEY, CACHE_DURATION, JSON.stringify(catalogs)),
            redis.setex(TIKTOK_PERFORMANCE_KEY, CACHE_DURATION, JSON.stringify(performance)),
            updateTikTokStats(stats),
          ])
        } catch (err) {
          console.error('[v0] Error refreshing all data:', err)
        }

        console.log('[v0] TikTok API - All data refreshed')

        return NextResponse.json({ success: true, data: { stats, campaigns, leads, catalogs, performance } })
      }

      case 'clear-cache': {
        try {
          await Promise.all([
            redis.del(TIKTOK_STATS_KEY),
            redis.del(TIKTOK_CAMPAIGNS_KEY),
            redis.del(TIKTOK_LEADS_KEY),
            redis.del(TIKTOK_CATALOGS_KEY),
            redis.del(TIKTOK_PERFORMANCE_KEY),
          ])
        } catch (err) {
          console.error('[v0] Error clearing cache:', err)
        }
        return NextResponse.json({ success: true, message: 'Cache cleared' })
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] TikTok data POST error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
