import { createClient } from '@/utils/supabase/server'

export interface DivvyStats {
  total_trips: number
  active_stations: number
  peak_hour_users: number
  avg_trip_duration: number
  timestamp: string
}

export interface DivvyStation {
  id: number
  name: string
  trips: number
  usage_rate: number
  growth_percent: string
  active: boolean
  latitude: number
  longitude: number
}

export interface DivvyHourlyData {
  hour: number
  starts: number
  timestamp: string
}

// Get or initialize dashboard stats
export async function getDashboardStats(): Promise<DivvyStats> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('divvy_stats')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('[v0] Error fetching stats:', error)
      return getDefaultStats()
    }

    return data
  } catch (error) {
    console.error('[v0] Failed to get stats:', error)
    return getDefaultStats()
  }
}

// Get all stations data
export async function getStations(): Promise<DivvyStation[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('divvy_stations')
      .select('*')
      .order('trips', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching stations:', error)
      return getDefaultStations()
    }

    return data || []
  } catch (error) {
    console.error('[v0] Failed to get stations:', error)
    return getDefaultStations()
  }
}

// Get hourly data
export async function getHourlyData(): Promise<DivvyHourlyData[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('divvy_hourly')
      .select('*')
      .order('hour', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching hourly data:', error)
      return getDefaultHourlyData()
    }

    return data || []
  } catch (error) {
    console.error('[v0] Failed to get hourly data:', error)
    return getDefaultHourlyData()
  }
}

// Update stats
export async function updateStats(stats: Partial<DivvyStats>) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('divvy_stats')
      .insert([
        {
          ...stats,
          timestamp: new Date().toISOString(),
        },
      ])

    if (error) {
      console.error('[v0] Error updating stats:', error)
    }
  } catch (error) {
    console.error('[v0] Failed to update stats:', error)
  }
}

// Default data fallbacks
function getDefaultStats(): DivvyStats {
  return {
    total_trips: 18500,
    active_stations: 587,
    peak_hour_users: 1200,
    avg_trip_duration: 18,
    timestamp: new Date().toISOString(),
  }
}

function getDefaultStations(): DivvyStation[] {
  return [
    { id: 1, name: 'Streeter Dr & Grand Ave', trips: 2850, usage_rate: 95, growth_percent: '+12.5%', active: true, latitude: 41.8927, longitude: -87.6233 },
    { id: 2, name: 'Michigan Ave & Oak St', trips: 2640, usage_rate: 88, growth_percent: '+9.2%', active: true, latitude: 41.8961, longitude: -87.6279 },
    { id: 3, name: 'Clark St & Elm St', trips: 2420, usage_rate: 81, growth_percent: '+7.8%', active: true, latitude: 41.9029, longitude: -87.6312 },
    { id: 4, name: 'Broadway & Barry Ave', trips: 2180, usage_rate: 73, growth_percent: '+5.4%', active: true, latitude: 41.9372, longitude: -87.6458 },
    { id: 5, name: 'Lakefront Trail & Navy Pier', trips: 1950, usage_rate: 65, growth_percent: '+3.2%', active: true, latitude: 41.8835, longitude: -87.6161 },
    { id: 6, name: 'Millennium Park', trips: 1820, usage_rate: 61, growth_percent: '+2.1%', active: true, latitude: 41.8829, longitude: -87.6233 },
    { id: 7, name: 'Maggie Daley Park', trips: 1650, usage_rate: 55, growth_percent: '-1.5%', active: false, latitude: 41.8825, longitude: -87.6256 },
    { id: 8, name: 'Art Institute of Chicago', trips: 1420, usage_rate: 47, growth_percent: '+0.8%', active: true, latitude: 41.8764, longitude: -87.6244 },
  ]
}

function getDefaultHourlyData(): DivvyHourlyData[] {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    starts: Math.floor(Math.random() * 600 + 100),
    timestamp: new Date().toISOString(),
  }))
}
