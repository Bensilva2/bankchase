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
      let stats = await redis.get<any>(TIKTOK_STATS_KEY)

      if (!stats) {
        const dbStats = await getTikTokStats()
        stats = dbStats || generateTikTokStats()
        await redis.setex(TIKTOK_STATS_KEY, CACHE_DURATION, JSON.stringify(stats))
      }
      data.stats = stats
    }

    if (dataType === 'all' || dataType === 'campaigns') {
      let campaigns = await redis.get<any[]>(TIKTOK_CAMPAIGNS_KEY)

      if (!campaigns) {
        const dbCampaigns = await getTikTokCampaigns()
        campaigns = dbCampaigns.length > 0 ? dbCampaigns : generateTikTokCampaigns()
        await redis.setex(TIKTOK_CAMPAIGNS_KEY, CACHE_DURATION, JSON.stringify(campaigns))
      }
      data.campaigns = campaigns
    }

    if (dataType === 'all' || dataType === 'leads') {
      let leads = await redis.get<any[]>(TIKTOK_LEADS_KEY)

      if (!leads) {
        const dbLeads = await getTikTokLeads()
        leads = dbLeads.length > 0 ? dbLeads : generateTikTokLeads()
        await redis.setex(TIKTOK_LEADS_KEY, CACHE_DURATION, JSON.stringify(leads))
      }
      data.leads = leads
    }

    if (dataType === 'all' || dataType === 'catalogs') {
      let catalogs = await redis.get<any[]>(TIKTOK_CATALOGS_KEY)

      if (!catalogs) {
        catalogs = generateTikTokCatalogs()
        await redis.setex(TIKTOK_CATALOGS_KEY, CACHE_DURATION, JSON.stringify(catalogs))
      }
      data.catalogs = catalogs
    }

    if (dataType === 'all' || dataType === 'performance') {
      let performance = await redis.get<any[]>(TIKTOK_PERFORMANCE_KEY)

      if (!performance) {
        performance = generateCampaignPerformance()
        await redis.setex(TIKTOK_PERFORMANCE_KEY, CACHE_DURATION, JSON.stringify(performance))
      }
      data.performance = performance
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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch TikTok data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
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
        await Promise.all([
          redis.setex(TIKTOK_STATS_KEY, CACHE_DURATION, JSON.stringify(newStats)),
          updateTikTokStats(newStats),
        ])
        return NextResponse.json({ success: true, data: newStats })
      }

      case 'refresh-campaigns': {
        const newCampaigns = generateTikTokCampaigns()
        await redis.setex(TIKTOK_CAMPAIGNS_KEY, CACHE_DURATION, JSON.stringify(newCampaigns))
        return NextResponse.json({ success: true, data: newCampaigns })
      }

      case 'refresh-leads': {
        const newLeads = generateTikTokLeads()
        await redis.setex(TIKTOK_LEADS_KEY, CACHE_DURATION, JSON.stringify(newLeads))
        return NextResponse.json({ success: true, data: newLeads })
      }

      case 'refresh-all': {
        const stats = generateTikTokStats()
        const campaigns = generateTikTokCampaigns()
        const leads = generateTikTokLeads()
        const catalogs = generateTikTokCatalogs()
        const performance = generateCampaignPerformance()

        await Promise.all([
          redis.setex(TIKTOK_STATS_KEY, CACHE_DURATION, JSON.stringify(stats)),
          redis.setex(TIKTOK_CAMPAIGNS_KEY, CACHE_DURATION, JSON.stringify(campaigns)),
          redis.setex(TIKTOK_LEADS_KEY, CACHE_DURATION, JSON.stringify(leads)),
          redis.setex(TIKTOK_CATALOGS_KEY, CACHE_DURATION, JSON.stringify(catalogs)),
          redis.setex(TIKTOK_PERFORMANCE_KEY, CACHE_DURATION, JSON.stringify(performance)),
          updateTikTokStats(stats),
        ])

        console.log('[v0] TikTok API - All data refreshed')

        return NextResponse.json({ success: true, data: { stats, campaigns, leads, catalogs, performance } })
      }

      case 'clear-cache': {
        await Promise.all([
          redis.del(TIKTOK_STATS_KEY),
          redis.del(TIKTOK_CAMPAIGNS_KEY),
          redis.del(TIKTOK_LEADS_KEY),
          redis.del(TIKTOK_CATALOGS_KEY),
          redis.del(TIKTOK_PERFORMANCE_KEY),
        ])
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
