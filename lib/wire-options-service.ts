/**
 * Wire Transfer Options Service
 * Manages all available wire transfer options and settings
 */

export interface WireOption {
  id: string
  name: string
  description: string
  enabled: boolean
  requiresVerification: boolean
  fee: number
  processingTime: string
  limits: {
    min: number
    max: number
    daily: number
  }
}

export interface WireTransferSettings {
  userId: string
  domesticEnabled: boolean
  internationalEnabled: boolean
  urgentWireEnabled: boolean
  futureWireEnabled: boolean
  selectedOptions: string[]
  verificationLevel: 'basic' | 'enhanced' | 'full'
}

export const DEFAULT_WIRE_OPTIONS: WireOption[] = [
  {
    id: 'domestic-standard',
    name: 'Domestic Wire - Standard',
    description: 'Standard domestic wire transfer (1-3 business days)',
    enabled: true,
    requiresVerification: true,
    fee: 30,
    processingTime: '1-3 business days',
    limits: {
      min: 0,
      max: 250000,
      daily: 500000,
    },
  },
  {
    id: 'domestic-priority',
    name: 'Domestic Wire - Priority',
    description: 'Priority domestic wire (same day processing)',
    enabled: true,
    requiresVerification: true,
    fee: 50,
    processingTime: 'Same day (by 5 PM EST)',
    limits: {
      min: 0,
      max: 100000,
      daily: 250000,
    },
  },
  {
    id: 'international-standard',
    name: 'International Wire - Standard',
    description: 'Standard international wire (3-5 business days)',
    enabled: true,
    requiresVerification: true,
    fee: 45,
    processingTime: '3-5 business days',
    limits: {
      min: 0,
      max: 100000,
      daily: 200000,
    },
  },
  {
    id: 'international-priority',
    name: 'International Wire - Priority',
    description: 'Priority international wire (1-2 business days)',
    enabled: true,
    requiresVerification: true,
    fee: 75,
    processingTime: '1-2 business days',
    limits: {
      min: 0,
      max: 50000,
      daily: 100000,
    },
  },
  {
    id: 'urgent-wire',
    name: 'Urgent Wire Transfer',
    description: 'Ultra-fast wire transfer (within 4 hours)',
    enabled: true,
    requiresVerification: true,
    fee: 150,
    processingTime: 'Within 4 hours',
    limits: {
      min: 0,
      max: 25000,
      daily: 50000,
    },
  },
  {
    id: 'future-dated',
    name: 'Future-Dated Wire',
    description: 'Schedule wire transfer for a future date',
    enabled: true,
    requiresVerification: false,
    fee: 30,
    processingTime: 'Scheduled date',
    limits: {
      min: 0,
      max: 250000,
      daily: 500000,
    },
  },
  {
    id: 'recurring-wire',
    name: 'Recurring Wire Transfer',
    description: 'Set up automatic wire transfers on a schedule',
    enabled: true,
    requiresVerification: false,
    fee: 25,
    processingTime: 'Per schedule',
    limits: {
      min: 0,
      max: 100000,
      daily: 300000,
    },
  },
  {
    id: 'wire-to-account',
    name: 'Wire to Own Account',
    description: 'Transfer between your own accounts at other banks',
    enabled: true,
    requiresVerification: false,
    fee: 20,
    processingTime: '1-2 business days',
    limits: {
      min: 0,
      max: 500000,
      daily: 1000000,
    },
  },
]

export class WireOptionsService {
  private options: WireOption[] = DEFAULT_WIRE_OPTIONS
  private settings: WireTransferSettings | null = null

  /**
   * Get all available wire options
   */
  getOptions(): WireOption[] {
    return this.options.filter((opt) => opt.enabled)
  }

  /**
   * Get specific wire option
   */
  getOption(optionId: string): WireOption | undefined {
    return this.options.find((opt) => opt.id === optionId)
  }

  /**
   * Update wire option settings
   */
  updateOption(optionId: string, updates: Partial<WireOption>): void {
    const index = this.options.findIndex((opt) => opt.id === optionId)
    if (index !== -1) {
      this.options[index] = { ...this.options[index], ...updates }
    }
  }

  /**
   * Check if wire option is available based on amount
   */
  isOptionAvailable(optionId: string, amount: number): boolean {
    const option = this.getOption(optionId)
    if (!option || !option.enabled) return false

    return amount >= option.limits.min && amount <= option.limits.max
  }

  /**
   * Get fee for wire option
   */
  getFee(optionId: string): number {
    const option = this.getOption(optionId)
    return option?.fee || 0
  }

  /**
   * Get processing time for wire option
   */
  getProcessingTime(optionId: string): string {
    const option = this.getOption(optionId)
    return option?.processingTime || 'Unknown'
  }

  /**
   * Check if wire option requires verification
   */
  requiresVerification(optionId: string): boolean {
    const option = this.getOption(optionId)
    return option?.requiresVerification || false
  }

  /**
   * Get limits for wire option
   */
  getLimits(optionId: string): WireOption['limits'] | undefined {
    const option = this.getOption(optionId)
    return option?.limits
  }

  /**
   * Get recommended wire option based on amount and speed preference
   */
  getRecommendedOption(
    amount: number,
    speedPreference: 'standard' | 'fast' | 'urgent'
  ): WireOption | undefined {
    const availableOptions = this.getOptions().filter((opt) =>
      this.isOptionAvailable(opt.id, amount)
    )

    if (availableOptions.length === 0) return undefined

    switch (speedPreference) {
      case 'urgent':
        return (
          availableOptions.find((opt) => opt.id.includes('priority') || opt.id.includes('urgent')) ||
          availableOptions[0]
        )
      case 'fast':
        return (
          availableOptions.find((opt) => opt.id.includes('priority')) || availableOptions[0]
        )
      case 'standard':
      default:
        return availableOptions.find((opt) => !opt.id.includes('priority') && !opt.id.includes('urgent')) ||
          availableOptions[0]
    }
  }

  /**
   * Get all options grouped by category
   */
  getOptionsByCategory(): Record<string, WireOption[]> {
    const grouped: Record<string, WireOption[]> = {
      domestic: [],
      international: [],
      special: [],
    }

    this.getOptions().forEach((opt) => {
      if (opt.id.includes('domestic')) {
        grouped.domestic.push(opt)
      } else if (opt.id.includes('international')) {
        grouped.international.push(opt)
      } else {
        grouped.special.push(opt)
      }
    })

    return grouped
  }

  /**
   * Calculate total cost with fee
   */
  calculateTotalCost(optionId: string, amount: number): number {
    const fee = this.getFee(optionId)
    return amount + fee
  }

  /**
   * Validate wire transfer parameters
   */
  validateWireTransfer(
    optionId: string,
    amount: number,
    recipientCountry?: string
  ): { valid: boolean; error?: string } {
    const option = this.getOption(optionId)

    if (!option) {
      return { valid: false, error: 'Wire option not found' }
    }

    if (!option.enabled) {
      return { valid: false, error: 'This wire option is currently unavailable' }
    }

    if (amount < option.limits.min) {
      return { valid: false, error: `Minimum amount is $${option.limits.min}` }
    }

    if (amount > option.limits.max) {
      return { valid: false, error: `Maximum amount is $${option.limits.max}` }
    }

    // International wire additional validation
    if (optionId.includes('international') && !recipientCountry) {
      return { valid: false, error: 'Recipient country is required for international wire' }
    }

    return { valid: true }
  }

  /**
   * Get estimated delivery date
   */
  getEstimatedDeliveryDate(optionId: string, fromDate: Date = new Date()): Date {
    const option = this.getOption(optionId)
    if (!option) return fromDate

    const processingTime = option.processingTime.toLowerCase()

    let daysToAdd = 1

    if (processingTime.includes('same day')) {
      daysToAdd = 0
    } else if (processingTime.includes('4 hours')) {
      daysToAdd = 0
    } else if (processingTime.includes('1-2')) {
      daysToAdd = 2
    } else if (processingTime.includes('1-3')) {
      daysToAdd = 3
    } else if (processingTime.includes('3-5')) {
      daysToAdd = 5
    }

    // Add business days (skip weekends)
    const deliveryDate = new Date(fromDate)
    let addedDays = 0

    while (addedDays < daysToAdd) {
      deliveryDate.setDate(deliveryDate.getDate() + 1)
      const dayOfWeek = deliveryDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // 0 = Sunday, 6 = Saturday
        addedDays++
      }
    }

    return deliveryDate
  }

  /**
   * Get real-time status for a wire transfer
   */
  async getWireStatus(transactionId: string): Promise<{
    status: string
    estimatedDelivery: Date
    lastUpdate: Date
  }> {
    // Simulate real-time status check
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'Processing',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          lastUpdate: new Date(),
        })
      }, 500)
    })
  }
}

// Export singleton instance
export const wireOptionsService = new WireOptionsService()
