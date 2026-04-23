/**
 * Payment Options Real-Time Sync Manager
 * Ensures smooth, real-time data flow across all payment operations
 * (Send Money, Transfer, Pay Bills, Wire Transfers)
 */

export interface PaymentState {
  sendMoney: {
    isOpen: boolean
    isLoading: boolean
    lastUpdated: number
  }
  transfer: {
    isOpen: boolean
    isLoading: boolean
    lastUpdated: number
  }
  payBills: {
    isOpen: boolean
    isLoading: boolean
    lastUpdated: number
  }
  wire: {
    isOpen: boolean
    isLoading: boolean
    lastUpdated: number
  }
}

export class PaymentSyncManager {
  private state: PaymentState = {
    sendMoney: { isOpen: false, isLoading: false, lastUpdated: 0 },
    transfer: { isOpen: false, isLoading: false, lastUpdated: 0 },
    payBills: { isOpen: false, isLoading: false, lastUpdated: 0 },
    wire: { isOpen: false, isLoading: false, lastUpdated: 0 },
  }

  private subscribers: Set<(state: PaymentState) => void> = new Set()

  /**
   * Subscribe to state changes for real-time updates
   */
  subscribe(callback: (state: PaymentState) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.state))
  }

  /**
   * Update payment option state with smooth transitions
   */
  updatePaymentOption(
    option: keyof PaymentState,
    updates: { isOpen?: boolean; isLoading?: boolean }
  ) {
    this.state[option] = {
      ...this.state[option],
      ...updates,
      lastUpdated: Date.now(),
    }
    this.notifySubscribers()
  }

  /**
   * Ensure only one payment option is open at a time
   */
  setActivePaymentOption(option: keyof PaymentState | null) {
    const options: Array<keyof PaymentState> = ["sendMoney", "transfer", "payBills", "wire"]

    options.forEach((opt) => {
      if (opt === option) {
        this.state[opt].isOpen = true
      } else {
        this.state[opt].isOpen = false
      }
      this.state[opt].lastUpdated = Date.now()
    })

    this.notifySubscribers()
  }

  /**
   * Set loading state for payment operation
   */
  setPaymentLoading(option: keyof PaymentState, isLoading: boolean) {
    this.state[option].isLoading = isLoading
    this.state[option].lastUpdated = Date.now()
    this.notifySubscribers()
  }

  /**
   * Get current state
   */
  getState(): PaymentState {
    return { ...this.state }
  }

  /**
   * Check if any payment option is currently open
   */
  isAnyPaymentOptionOpen(): boolean {
    return Object.values(this.state).some((opt) => opt.isOpen)
  }

  /**
   * Get currently active payment option
   */
  getActivePaymentOption(): keyof PaymentState | null {
    const active = Object.entries(this.state).find(([, opt]) => opt.isOpen)
    return active ? (active[0] as keyof PaymentState) : null
  }

  /**
   * Reset all state
   */
  reset() {
    this.state = {
      sendMoney: { isOpen: false, isLoading: false, lastUpdated: 0 },
      transfer: { isOpen: false, isLoading: false, lastUpdated: 0 },
      payBills: { isOpen: false, isLoading: false, lastUpdated: 0 },
      wire: { isOpen: false, isLoading: false, lastUpdated: 0 },
    }
    this.notifySubscribers()
  }
}

// Singleton instance
let syncManagerInstance: PaymentSyncManager | null = null

/**
 * Get or create the payment sync manager singleton
 */
export function getPaymentSyncManager(): PaymentSyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new PaymentSyncManager()
  }
  return syncManagerInstance
}

/**
 * Hook for React components to use the payment sync manager
 */
export function usePaymentSync() {
  const manager = getPaymentSyncManager()

  return {
    state: manager.getState(),
    updateOption: (option: keyof PaymentState, updates: { isOpen?: boolean; isLoading?: boolean }) =>
      manager.updatePaymentOption(option, updates),
    setActive: (option: keyof PaymentState | null) => manager.setActivePaymentOption(option),
    setLoading: (option: keyof PaymentState, isLoading: boolean) => manager.setPaymentLoading(option, isLoading),
    isAnyOpen: () => manager.isAnyPaymentOptionOpen(),
    getActive: () => manager.getActivePaymentOption(),
    reset: () => manager.reset(),
  }
}
