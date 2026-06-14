import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { getDashboardStats, getStations, getHourlyData, updateStats } from '@/lib/supabase-data'
import {
  generateDivvyStats,
  generateStationData,
  generateHourlyData,
  DivvyStats,
  StationData,
  HourlyData,
} from '@/lib/divvy-data'

const STATS_KEY = 'divvy:stats'
const STATIONS_KEY = 'divvy:stations'
const HOURLY_KEY = 'divvy:hourly'
const CACHE_DURATION = 60 // 1 minute

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dataType = searchParams.get('type') || 'all'

  try {
    const data: any = {}

    if (dataType === 'all' || dataType === 'stats') {
      // Try Redis cache first
      let stats = await redis.get<DivvyStats>(STATS_KEY)
      
      if (!stats) {
        // Fall back to Supabase
        stats = await getDashboardStats()
        // Cache in Redis
        await redis.setex(STATS_KEY, CACHE_DURATION, JSON.stringify(stats))
      }
      data.stats = stats
    }

    if (dataType === 'all' || dataType === 'stations') {
      // Try Redis cache first
      let stations = await redis.get<StationData[]>(STATIONS_KEY)
      
      if (!stations) {
        // Fall back to Supabase
        const supabaseStations = await getStations()
        stations = supabaseStations.map(s => ({
          id: s.id,
          name: s.name,
          trips: s.trips,
          usage_rate: s.usage_rate,
          growth: s.growth_percent,
        }))
        
        if (stations.length === 0) {
          stations = generateStationData()
        }
        
        // Cache in Redis
        await redis.setex(STATIONS_KEY, CACHE_DURATION, JSON.stringify(stations))
      }
      data.stations = stations
    }

    if (dataType === 'all' || dataType === 'hourly') {
      // Try Redis cache first
      let hourly = await redis.get<HourlyData[]>(HOURLY_KEY)
      
      if (!hourly) {
        // Fall back to Supabase
        const supabaseHourly = await getHourlyData()
        hourly = supabaseHourly.map(h => ({
          hour: h.hour.toString(),
          starts: h.starts,
        }))
        
        if (hourly.length === 0) {
          hourly = generateHourlyData()
        }
        
        // Cache in Redis
        await redis.setex(HOURLY_KEY, CACHE_DURATION, JSON.stringify(hourly))
      }
      data.hourly = hourly
    }

    console.log('[v0] Dashboard API GET - Success', { dataType, timestamp: new Date().toISOString() })

    return NextResponse.json({
      success: true,
      data,
      cached: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Dashboard data API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
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

    console.log('[v0] Dashboard API POST - Action:', action)

    switch (action) {
      case 'refresh-stats': {
        const newStats = generateDivvyStats()
        await Promise.all([
          redis.setex(STATS_KEY, CACHE_DURATION, JSON.stringify(newStats)),
          updateStats(newStats),
        ])
        return NextResponse.json({ success: true, data: newStats })
      }

      case 'refresh-stations': {
        const newStations = generateStationData()
        await redis.setex(STATIONS_KEY, CACHE_DURATION, JSON.stringify(newStations))
        return NextResponse.json({ success: true, data: newStations })
      }

      case 'refresh-hourly': {
        const newHourly = generateHourlyData()
        await redis.setex(HOURLY_KEY, CACHE_DURATION, JSON.stringify(newHourly))
        return NextResponse.json({ success: true, data: newHourly })
      }

      case 'refresh-all': {
        const stats = generateDivvyStats()
        const stations = generateStationData()
        const hourly = generateHourlyData()

        await Promise.all([
          redis.setex(STATS_KEY, CACHE_DURATION, JSON.stringify(stats)),
          redis.setex(STATIONS_KEY, CACHE_DURATION, JSON.stringify(stations)),
          redis.setex(HOURLY_KEY, CACHE_DURATION, JSON.stringify(hourly)),
          updateStats(stats),
        ])

        console.log('[v0] Dashboard API - All data refreshed')

        return NextResponse.json({ success: true, data: { stats, stations, hourly } })
      }

      case 'clear-cache': {
        await Promise.all([redis.del(STATS_KEY), redis.del(STATIONS_KEY), redis.del(HOURLY_KEY)])
        return NextResponse.json({ success: true, message: 'Cache cleared' })
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] Dashboard data POST error:', error)
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

