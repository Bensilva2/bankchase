import { NextResponse } from 'next/server'
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
const CACHE_DURATION = 60 // 1 minute in production, but demo updates more frequently

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dataType = searchParams.get('type') || 'all'

  try {
    const data: any = {}

    if (dataType === 'all' || dataType === 'stats') {
      let stats = await redis.get<DivvyStats>(STATS_KEY)
      if (!stats) {
        stats = generateDivvyStats()
        await redis.setex(STATS_KEY, CACHE_DURATION, JSON.stringify(stats))
      }
      data.stats = stats
    }

    if (dataType === 'all' || dataType === 'stations') {
      let stations = await redis.get<StationData[]>(STATIONS_KEY)
      if (!stations) {
        stations = generateStationData()
        await redis.setex(STATIONS_KEY, CACHE_DURATION, JSON.stringify(stations))
      }
      data.stations = stations
    }

    if (dataType === 'all' || dataType === 'hourly') {
      let hourly = await redis.get<HourlyData[]>(HOURLY_KEY)
      if (!hourly) {
        hourly = generateHourlyData()
        await redis.setex(HOURLY_KEY, CACHE_DURATION, JSON.stringify(hourly))
      }
      data.hourly = hourly
    }

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

export async function POST(request: Request) {
  const { action } = await request.json()

  try {
    switch (action) {
      case 'refresh-stats':
        const newStats = generateDivvyStats()
        await redis.setex(STATS_KEY, CACHE_DURATION, JSON.stringify(newStats))
        return NextResponse.json({ success: true, data: newStats })

      case 'refresh-stations':
        const newStations = generateStationData()
        await redis.setex(STATIONS_KEY, CACHE_DURATION, JSON.stringify(newStations))
        return NextResponse.json({ success: true, data: newStations })

      case 'refresh-hourly':
        const newHourly = generateHourlyData()
        await redis.setex(HOURLY_KEY, CACHE_DURATION, JSON.stringify(newHourly))
        return NextResponse.json({ success: true, data: newHourly })

      case 'refresh-all':
        const stats = generateDivvyStats()
        const stations = generateStationData()
        const hourly = generateHourlyData()

        await Promise.all([
          redis.setex(STATS_KEY, CACHE_DURATION, JSON.stringify(stats)),
          redis.setex(STATIONS_KEY, CACHE_DURATION, JSON.stringify(stations)),
          redis.setex(HOURLY_KEY, CACHE_DURATION, JSON.stringify(hourly)),
        ])

        return NextResponse.json({ success: true, data: { stats, stations, hourly } })

      case 'clear-cache':
        await Promise.all([redis.del(STATS_KEY), redis.del(STATIONS_KEY), redis.del(HOURLY_KEY)])
        return NextResponse.json({ success: true, message: 'Cache cleared' })

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
