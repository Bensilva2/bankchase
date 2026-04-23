export interface SettingsEnforcement {
  checkBiometric: () => Promise<boolean>
  checkAutoLock: () => boolean
  check2FA: () => boolean
  checkDataPermission: (permission: string) => boolean
  shouldSendNotification: (type: string) => boolean
  shouldShowAlert: (type: string, amount?: number) => boolean
  applyRoundUp: (amount: number) => { original: number; roundUp: number; total: number }
  translateText: (text: string, language: string) => string
  getTextSizeClass: (size: string) => string
}

export class SettingsEnforcer implements SettingsEnforcement {
  private lastActivity: number = Date.now()
  private activityTimer: NodeJS.Timeout | null = null

  constructor(private getSettings: () => any) {
    this.initActivityMonitor()
  }

  private initActivityMonitor() {
    if (typeof window === "undefined") return

    // Monitor user activity for auto-lock
    const resetActivity = () => {
      this.lastActivity = Date.now()
    }

    window.addEventListener("mousedown", resetActivity)
    window.addEventListener("keydown", resetActivity)
    window.addEventListener("touchstart", resetActivity)
    window.addEventListener("scroll", resetActivity)
  }

  async checkBiometric(): Promise<boolean> {
    const settings = this.getSettings()
    if (!settings?.biometricLogin) return true

    // Check if biometric permissions are granted
    if (!settings?.dataPermissions?.faceId && !settings?.dataPermissions?.touchId) {
      console.log("[v0] Biometric login enabled but no biometric permission granted")
      return false
    }

    // Simulate biometric check (in real app, use native APIs)
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("[v0] Biometric check performed")
        resolve(true)
      }, 500)
    })
  }

  checkAutoLock(): boolean {
    const settings = this.getSettings()
    if (!settings?.autoLockEnabled) return false

    const timeout = (settings?.sessionTimeout || 15) * 60 * 1000 // Convert minutes to ms
    const timeSinceLastActivity = Date.now() - this.lastActivity

    const shouldLock = timeSinceLastActivity >= timeout
    if (shouldLock) {
      console.log("[v0] Auto-lock triggered after", timeSinceLastActivity / 1000, "seconds")
    }
    return shouldLock
  }

  check2FA(): boolean {
    const settings = this.getSettings()
    return settings?.twoFactorAuth === true
  }

  checkDataPermission(permission: string): boolean {
    const settings = this.getSettings()
    const permissions = settings?.dataPermissions || {}

    const hasPermission = permissions[permission] === true
    if (!hasPermission) {
      console.log("[v0] Data permission denied:", permission)
    }
    return hasPermission
  }

  shouldSendNotification(type: "push" | "email" | "sms"): boolean {
    const settings = this.getSettings()

    switch (type) {
      case "push":
        return settings?.pushNotifications === true && settings?.dataPermissions?.notifications === true
      case "email":
        return settings?.emailNotifications === true
      case "sms":
        return settings?.smsAlerts === true
      default:
        return false
    }
  }

  shouldShowAlert(type: "transaction" | "balance" | "login", amount?: number): boolean {
    const settings = this.getSettings()

    switch (type) {
      case "transaction":
        return settings?.transactionAlerts === true
      case "balance":
        if (!settings?.balanceAlerts) return false
        if (amount !== undefined) {
          return amount < (settings?.balanceThreshold || 1000)
        }
        return true
      case "login":
        return settings?.loginAlerts === true
      default:
        return false
    }
  }

  applyRoundUp(amount: number): { original: number; roundUp: number; total: number } {
    const settings = this.getSettings()

    if (!settings?.roundUpSavings) {
      return { original: amount, roundUp: 0, total: amount }
    }

    const roundedUp = Math.ceil(amount)
    const roundUpAmount = roundedUp - amount

    console.log("[v0] Round-up applied:", amount, "→", roundedUp, "(+$" + roundUpAmount.toFixed(2) + ")")

    return {
      original: amount,
      roundUp: roundUpAmount,
      total: roundedUp,
    }
  }

  translateText(text: string, language: string): string {
    // Simple translation map (in real app, use i18n library)
    const translations: Record<string, Record<string, string>> = {
      Spanish: {
        "Good morning": "Buenos días",
        "Good afternoon": "Buenas tardes",
        "Good evening": "Buenas noches",
        "Welcome back": "Bienvenido de nuevo",
        Accounts: "Cuentas",
        "Pay & Transfer": "Pagar y Transferir",
        "Plan & Track": "Planificar y Rastrear",
        Offers: "Ofertas",
        More: "Más",
      },
      French: {
        "Good morning": "Bonjour",
        "Good afternoon": "Bon après-midi",
        "Good evening": "Bonsoir",
        "Welcome back": "Bon retour",
        Accounts: "Comptes",
        "Pay & Transfer": "Payer et Transférer",
        "Plan & Track": "Planifier et Suivre",
        Offers: "Offres",
        More: "Plus",
      },
      Chinese: {
        "Good morning": "早上好",
        "Good afternoon": "下午好",
        "Good evening": "晚上好",
        "Welcome back": "欢迎回来",
        Accounts: "账户",
        "Pay & Transfer": "支付和转账",
        "Plan & Track": "计划和跟踪",
        Offers: "优惠",
        More: "更多",
      },
    }

    if (language === "English") return text
    return translations[language]?.[text] || text
  }

  getTextSizeClass(size: string): string {
    const sizeMap: Record<string, string> = {
      small: "text-sm",
      medium: "text-base",
      large: "text-lg",
      "extra-large": "text-xl",
    }
    return sizeMap[size] || "text-base"
  }

  getLastActivity(): number {
    return this.lastActivity
  }

  resetActivity(): void {
    this.lastActivity = Date.now()
  }

  destroy() {
    if (this.activityTimer) {
      clearInterval(this.activityTimer)
    }
  }
}
