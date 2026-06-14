// Mock TikTok Ads Manager data generation
export interface TikTokCampaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  roi: number
  creatives: number
}

export interface TikTokLead {
  id: string
  name: string
  email: string
  phone: string
  campaignId: string
  timestamp: Date
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED'
  value: number
}

export interface TikTokCatalog {
  id: string
  name: string
  productCount: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: Date
  updatedAt: Date
}

export interface TikTokStats {
  totalCampaigns: number
  activeCampaigns: number
  totalSpent: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  averageROI: number
  leadCount: number
}

export function generateTikTokStats(): TikTokStats {
  return {
    totalCampaigns: Math.floor(Math.random() * 20) + 5,
    activeCampaigns: Math.floor(Math.random() * 15) + 2,
    totalSpent: Math.floor(Math.random() * 50000) + 10000,
    totalImpressions: Math.floor(Math.random() * 5000000) + 500000,
    totalClicks: Math.floor(Math.random() * 150000) + 10000,
    totalConversions: Math.floor(Math.random() * 5000) + 500,
    averageROI: parseFloat((Math.random() * 400 + 50).toFixed(2)),
    leadCount: Math.floor(Math.random() * 1000) + 100,
  }
}

export function generateTikTokCampaigns(): TikTokCampaign[] {
  const statuses: Array<'ACTIVE' | 'PAUSED' | 'COMPLETED'> = ['ACTIVE', 'PAUSED', 'COMPLETED']
  return [
    {
      id: 'camp_001',
      name: 'Summer Sale Campaign',
      status: 'ACTIVE',
      budget: 5000,
      spent: 3250,
      impressions: 450000,
      clicks: 15600,
      conversions: 850,
      ctr: 3.47,
      cpc: 0.21,
      roi: 285.5,
      creatives: 8,
    },
    {
      id: 'camp_002',
      name: 'New Product Launch',
      status: 'ACTIVE',
      budget: 8000,
      spent: 6800,
      impressions: 720000,
      clicks: 28500,
      conversions: 1420,
      ctr: 3.96,
      cpc: 0.24,
      roi: 312.3,
      creatives: 12,
    },
    {
      id: 'camp_003',
      name: 'Black Friday Promo',
      status: 'ACTIVE',
      budget: 10000,
      spent: 9200,
      impressions: 950000,
      clicks: 35200,
      conversions: 2150,
      ctr: 3.71,
      cpc: 0.26,
      roi: 245.7,
      creatives: 15,
    },
    {
      id: 'camp_004',
      name: 'Re-engagement Campaign',
      status: 'PAUSED',
      budget: 3000,
      spent: 1800,
      impressions: 280000,
      clicks: 8900,
      conversions: 320,
      ctr: 3.18,
      cpc: 0.20,
      roi: 178.2,
      creatives: 5,
    },
    {
      id: 'camp_005',
      name: 'Holiday Gift Guide',
      status: 'COMPLETED',
      budget: 6500,
      spent: 6500,
      impressions: 820000,
      clicks: 24500,
      conversions: 980,
      ctr: 2.99,
      cpc: 0.27,
      roi: 156.4,
      creatives: 10,
    },
  ]
}

export function generateTikTokLeads(): TikTokLead[] {
  const statuses: Array<'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED'> = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED']
  const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Jessica', 'Robert', 'Lisa', 'James', 'Jennifer']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com', 'business.com']

  return Array.from({ length: 12 }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`

    return {
      id: `lead_${String(i + 1).padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      email,
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      campaignId: `camp_${String((i % 5) + 1).padStart(3, '0')}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      value: Math.floor(Math.random() * 5000) + 500,
    }
  })
}

export function generateTikTokCatalogs(): TikTokCatalog[] {
  return [
    {
      id: 'cat_001',
      name: 'Main Product Catalog',
      productCount: 1250,
      status: 'ACTIVE',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date(),
    },
    {
      id: 'cat_002',
      name: 'Summer Collection',
      productCount: 450,
      status: 'ACTIVE',
      createdAt: new Date('2025-05-01'),
      updatedAt: new Date(),
    },
    {
      id: 'cat_003',
      name: 'Clearance Items',
      productCount: 280,
      status: 'ACTIVE',
      createdAt: new Date('2025-06-01'),
      updatedAt: new Date(),
    },
    {
      id: 'cat_004',
      name: 'Holiday Special',
      productCount: 600,
      status: 'INACTIVE',
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2024-12-25'),
    },
  ]
}

export function generateCampaignPerformance() {
  return [
    { date: 'Jun 8', spend: 450, impressions: 45000, clicks: 1580, conversions: 85 },
    { date: 'Jun 9', spend: 520, impressions: 52000, clicks: 1840, conversions: 102 },
    { date: 'Jun 10', spend: 480, impressions: 48000, clicks: 1720, conversions: 95 },
    { date: 'Jun 11', spend: 610, impressions: 61000, clicks: 2150, conversions: 128 },
    { date: 'Jun 12', spend: 680, impressions: 68000, clicks: 2380, conversions: 142 },
    { date: 'Jun 13', spend: 750, impressions: 75000, clicks: 2650, conversions: 158 },
    { date: 'Jun 14', spend: 820, impressions: 82000, clicks: 2890, conversions: 175 },
  ]
}
