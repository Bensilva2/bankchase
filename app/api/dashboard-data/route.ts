import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
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
      try {
        // Try Redis cache first
        let stats = await redis.get<DivvyStats>(STATS_KEY)
        
        if (!stats) {
          stats = generateDivvyStats()
          try {
            await redis.setex(STATS_KEY, CACHE_DURATION, JSON.stringify(stats))
          } catch (e) {
            console.error('[v0] Redis cache error:', e)
          }
        }
        data.stats = stats
      } catch (e) {
        console.error('[v0] Stats error:', e)
        data.stats = generateDivvyStats()
      }
    }

    if (dataType === 'all' || dataType === 'stations') {
      try {
        // Try Redis cache first
        let stations = await redis.get<StationData[]>(STATIONS_KEY)
        
        if (!stations) {
          stations = generateStationData()
          try {
            await redis.setex(STATIONS_KEY, CACHE_DURATION, JSON.stringify(stations))
          } catch (e) {
            console.error('[v0] Redis cache error:', e)
          }
        }
        data.stations = stations
      } catch (e) {
        console.error('[v0] Stations error:', e)
        data.stations = generateStationData()
      }
    }

    if (dataType === 'all' || dataType === 'hourly') {
      try {
        // Try Redis cache first
        let hourly = await redis.get<HourlyData[]>(HOURLY_KEY)
        
        if (!hourly) {
          hourly = generateHourlyData()
          try {
            await redis.setex(HOURLY_KEY, CACHE_DURATION, JSON.stringify(hourly))
          } catch (e) {
            console.error('[v0] Redis cache error:', e)
          }
        }
        data.hourly = hourly
      } catch (e) {
        console.error('[v0] Hourly error:', e)
        data.hourly = generateHourlyData()
      }
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
    // Always return data, even if there's an error
    return NextResponse.json({
      success: true,
      data: {
        stats: generateDivvyStats(),
        stations: generateStationData(),
        hourly: generateHourlyData(),
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

    console.log('[v0] Dashboard API POST - Action:', action)

    switch (action) {
      case 'refresh-stats': {
        const newStats = generateDivvyStats()
        try {
          await redis.setex(STATS_KEY, CACHE_DURATION, JSON.stringify(newStats))
        } catch (e) {
          console.error('[v0] Redis error:', e)
        }
        return NextResponse.json({ success: true, data: newStats })
      }

      case 'refresh-stations': {
        const newStations = generateStationData()
        try {
          await redis.setex(STATIONS_KEY, CACHE_DURATION, JSON.stringify(newStations))
        } catch (e) {
          console.error('[v0] Redis error:', e)
        }
        return NextResponse.json({ success: true, data: newStations })
      }

      case 'refresh-hourly': {
        const newHourly = generateHourlyData()
        try {
          await redis.setex(HOURLY_KEY, CACHE_DURATION, JSON.stringify(newHourly))
        } catch (e) {
          console.error('[v0] Redis error:', e)
        }
        return NextResponse.json({ success: true, data: newHourly })
      }

      case 'refresh-all': {
        const stats = generateDivvyStats()
        const stations = generateStationData()
        const hourly = generateHourlyData()

        try {
          await Promise.all([
            redis.setex(STATS_KEY, CACHE_DURATION, JSON.stringify(stats)),
            redis.setex(STATIONS_KEY, CACHE_DURATION, JSON.stringify(stations)),
            redis.setex(HOURLY_KEY, CACHE_DURATION, JSON.stringify(hourly)),
          ])
        } catch (e) {
          console.error('[v0] Redis error:', e)
        }

        console.log('[v0] Dashboard API - All data refreshed')

        return NextResponse.json({ success: true, data: { stats, stations, hourly } })
      }

      case 'clear-cache': {
        try {
          await Promise.all([redis.del(STATS_KEY), redis.del(STATIONS_KEY), redis.del(HOURLY_KEY)])
        } catch (e) {
          console.error('[v0] Redis error:', e)
        }
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

