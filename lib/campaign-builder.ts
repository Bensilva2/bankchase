// Campaign Builder Wizard - Step-by-step campaign creation
export interface CampaignStep {
  id: number
  title: string
  description: string
}

export interface CampaignFormData {
  campaignName: string
  campaignObjective: 'awareness' | 'traffic' | 'conversion' | 'lead'
  budgetType: 'daily' | 'lifetime'
  dailyBudget?: number
  totalBudget?: number
  startDate?: string
  endDate?: string
  targetAudience: {
    ageMin?: number
    ageMax?: number
    gender?: 'all' | 'male' | 'female'
    locations?: string[]
    interests?: string[]
  }
  adGroups: AdGroupData[]
}

export interface AdGroupData {
  id: string
  name: string
  biddingStrategy: 'lowest_cost' | 'target_cpc' | 'target_roas'
  bidAmount?: number
  dailyBudget?: number
  status: 'active' | 'paused' | 'archived'
  creative: {
    videoUrl?: string
    headline?: string
    description?: string
    callToAction?: string
  }
  catalogs?: string[]
}

export interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  sku: string
  inventory: number
}

export interface Catalog {
  id: string
  name: string
  description: string
  products: Product[]
  createdAt: Date
}

export const campaignSteps: CampaignStep[] = [
  {
    id: 1,
    title: 'Campaign Details',
    description: 'Set up your campaign name, objective, and budget',
  },
  {
    id: 2,
    title: 'Audience Targeting',
    description: 'Define your target audience demographics and interests',
  },
  {
    id: 3,
    title: 'Ad Groups',
    description: 'Create and configure ad groups',
  },
  {
    id: 4,
    title: 'Creative & Catalogs',
    description: 'Add creative assets and select product catalogs',
  },
  {
    id: 5,
    title: 'Review & Launch',
    description: 'Review your campaign and launch',
  },
]

export const campaignObjectives = [
  { value: 'awareness', label: 'Brand Awareness', icon: 'Eye' },
  { value: 'traffic', label: 'Website Traffic', icon: 'Send' },
  { value: 'conversion', label: 'Conversions', icon: 'Target' },
  { value: 'lead', label: 'Lead Generation', icon: 'User' },
]

export const biddingStrategies = [
  { value: 'lowest_cost', label: 'Lowest Cost', description: 'Optimize for lowest cost per conversion' },
  { value: 'target_cpc', label: 'Target CPC', description: 'Set your desired cost per click' },
  { value: 'target_roas', label: 'Target ROAS', description: 'Optimize for return on ad spend' },
]

export const generateMockProducts = (): Product[] => [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 199.99,
    image: '/products/headphones.jpg',
    category: 'Electronics',
    sku: 'HEAD-001',
    inventory: 150,
  },
  {
    id: '2',
    name: 'Leather Messenger Bag',
    price: 129.99,
    image: '/products/bag.jpg',
    category: 'Accessories',
    sku: 'BAG-001',
    inventory: 75,
  },
  {
    id: '3',
    name: 'Smart Watch Pro',
    price: 349.99,
    image: '/products/watch.jpg',
    category: 'Electronics',
    sku: 'WATCH-001',
    inventory: 200,
  },
  {
    id: '4',
    name: 'Bluetooth Speaker',
    price: 89.99,
    image: '/products/speaker.jpg',
    category: 'Electronics',
    sku: 'SPEAK-001',
    inventory: 300,
  },
  {
    id: '5',
    name: 'USB-C Cable 2Pack',
    price: 24.99,
    image: '/products/cable.jpg',
    category: 'Accessories',
    sku: 'CABLE-001',
    inventory: 500,
  },
  {
    id: '6',
    name: 'Phone Stand Metal',
    price: 34.99,
    image: '/products/stand.jpg',
    category: 'Accessories',
    sku: 'STAND-001',
    inventory: 250,
  },
]

export const generateMockCatalogs = (): Catalog[] => [
  {
    id: 'cat-1',
    name: 'Electronics & Tech',
    description: 'Premium tech products and gadgets',
    products: generateMockProducts().filter(p => p.category === 'Electronics'),
    createdAt: new Date('2026-03-01'),
  },
  {
    id: 'cat-2',
    name: 'Accessories',
    description: 'Essential accessories for daily use',
    products: generateMockProducts().filter(p => p.category === 'Accessories'),
    createdAt: new Date('2026-02-15'),
  },
]
