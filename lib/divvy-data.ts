// Mock Divvy data service
// In production, this would fetch from the actual Divvy API

export interface DivvyStats {
  totalTrips: number
  activeStations: number
  peakHourUsers: number
  avgTripDuration: number
  lastUpdated: string
}

export interface StationData {
  id: number
  name: string
  trips: number
  usage: number
  growth: string
  lat?: number
  lng?: number
  active?: boolean
}

export interface HourlyData {
  hour: string
  starts: number
  x: number
  y: number
}

// Generate mock data with slight variance for demo purposes
export function generateDivvyStats(): DivvyStats {
  const variance = Math.random() * 500 + 500 // Add variance to make it feel real
  return {
    totalTrips: Math.floor(18500 + variance),
    activeStations: Math.floor(585 + Math.random() * 4),
    peakHourUsers: Math.floor(1200 + Math.random() * 100),
    avgTripDuration: Math.floor(17 + Math.random() * 2),
    lastUpdated: new Date().toISOString(),
  }
}

export function generateStationData(): StationData[] {
  const baseStations: StationData[] = [
    { id: 1, name: 'Streeter Dr & Grand Ave', trips: 2850, usage: 95, growth: '+12.5%' },
    { id: 2, name: 'Michigan Ave & Oak St', trips: 2640, usage: 88, growth: '+9.2%' },
    { id: 3, name: 'Clark St & Elm St', trips: 2420, usage: 81, growth: '+7.8%' },
    { id: 4, name: 'Broadway & Barry Ave', trips: 2180, usage: 73, growth: '+5.4%' },
    { id: 5, name: 'Lakefront Trail & Navy Pier', trips: 1950, usage: 65, growth: '+3.2%' },
    { id: 6, name: 'Millennium Park', trips: 1820, usage: 61, growth: '+2.1%' },
    { id: 7, name: 'Maggie Daley Park', trips: 1650, usage: 55, growth: '-1.5%' },
    { id: 8, name: 'Art Institute of Chicago', trips: 1420, usage: 47, growth: '+0.8%' },
  ]

  // Add slight variance to simulate real-time updates
  return baseStations.map((station) => ({
    ...station,
    trips: Math.floor(station.trips + Math.random() * 100 - 50),
  }))
}

export function generateHourlyData(): HourlyData[] {
  return [
    { hour: '12 AM', starts: 45, x: 0, y: 45 },
    { hour: '1 AM', starts: 38, x: 1, y: 38 },
    { hour: '2 AM', starts: 32, x: 2, y: 32 },
    { hour: '3 AM', starts: 28, x: 3, y: 28 },
    { hour: '4 AM', starts: 35, x: 4, y: 35 },
    { hour: '5 AM', starts: 52, x: 5, y: 52 },
    { hour: '6 AM', starts: 145, x: 6, y: 145 },
    { hour: '7 AM', starts: 280, x: 7, y: 280 },
    { hour: '8 AM', starts: 420, x: 8, y: 420 },
    { hour: '9 AM', starts: 385, x: 9, y: 385 },
    { hour: '10 AM', starts: 320, x: 10, y: 320 },
    { hour: '11 AM', starts: 380, x: 11, y: 380 },
    { hour: '12 PM', starts: 480, x: 12, y: 480 },
    { hour: '1 PM', starts: 520, x: 13, y: 520 },
    { hour: '2 PM', starts: 485, x: 14, y: 485 },
    { hour: '3 PM', starts: 490, x: 15, y: 490 },
    { hour: '4 PM', starts: 580, x: 16, y: 580 },
    { hour: '5 PM', starts: 620, x: 17, y: 620 },
    { hour: '6 PM', starts: 550, x: 18, y: 550 },
    { hour: '7 PM', starts: 420, x: 19, y: 420 },
    { hour: '8 PM', starts: 340, x: 20, y: 340 },
    { hour: '9 PM', starts: 280, x: 21, y: 280 },
    { hour: '10 PM', starts: 200, x: 22, y: 200 },
    { hour: '11 PM', starts: 120, x: 23, y: 120 },
  ]
}
