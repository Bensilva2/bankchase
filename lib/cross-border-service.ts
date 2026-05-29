// Cross-Border Transfer Service
// Implements patterns for international wire transfers using 
// SWIFT, RippleNet, and real-time payment networks

export interface CrossBorderTransferRequest {
  // Sender info
  senderAccountId: string
  senderName: string
  senderAddress: string
  senderCountry: string

  // Recipient info
  recipientName: string
  recipientBank: string
  recipientBankAddress?: string
  recipientCountry: string
  recipientAccountNumber: string
  recipientIBAN?: string
  swiftBic: string

  // Transfer details
  amount: number
  sourceCurrency: string
  targetCurrency: string
  purpose: string
  reference?: string
}

export interface CrossBorderTransferResponse {
  success: boolean
  transactionId?: string
  swiftReference?: string
  estimatedArrival?: string
  exchangeRate?: number
  convertedAmount?: number
  fees: {
    wireFee: number
    correspondentFee: number
    exchangeFee: number
    totalFees: number
  }
  status: "initiated" | "pending_compliance" | "processing" | "sent" | "completed" | "failed"
  error?: string
}

export interface ExchangeRateInfo {
  sourceCurrency: string
  targetCurrency: string
  rate: number
  inverseRate: number
  timestamp: string
  provider: string
}

// Supported currencies for international transfers
export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
]

// Transfer corridors and estimated times
export const TRANSFER_CORRIDORS: Record<string, { estimatedDays: string; method: string }> = {
  "USD-EUR": { estimatedDays: "1-2 business days", method: "SWIFT gpi" },
  "USD-GBP": { estimatedDays: "1-2 business days", method: "SWIFT gpi" },
  "USD-CAD": { estimatedDays: "Same day", method: "Real-time" },
  "USD-MXN": { estimatedDays: "Same day", method: "Real-time" },
  "USD-JPY": { estimatedDays: "1-2 business days", method: "SWIFT gpi" },
  "USD-INR": { estimatedDays: "1-3 business days", method: "SWIFT" },
  "USD-CNY": { estimatedDays: "2-3 business days", method: "SWIFT" },
  "USD-BRL": { estimatedDays: "1-2 business days", method: "SWIFT gpi" },
  "USD-NGN": { estimatedDays: "2-4 business days", method: "SWIFT" },
  "default": { estimatedDays: "2-5 business days", method: "SWIFT" },
}

// Mock exchange rates (in production, these would come from a forex API)
const MOCK_EXCHANGE_RATES: Record<string, number> = {
  "USD-EUR": 0.92,
  "USD-GBP": 0.79,
  "USD-JPY": 149.50,
  "USD-CAD": 1.36,
  "USD-AUD": 1.53,
  "USD-CHF": 0.88,
  "USD-CNY": 7.24,
  "USD-INR": 83.12,
  "USD-MXN": 17.15,
  "USD-BRL": 4.97,
  "USD-SGD": 1.34,
  "USD-HKD": 7.82,
  "USD-KRW": 1328.50,
  "USD-ZAR": 18.65,
  "USD-AED": 3.67,
  "USD-NGN": 1550.00,
  "USD-PHP": 55.80,
}

/**
 * Get current exchange rate for a currency pair
 */
export function getExchangeRate(
  sourceCurrency: string,
  targetCurrency: string
): ExchangeRateInfo {
  const pair = `${sourceCurrency}-${targetCurrency}`
  const reversePair = `${targetCurrency}-${sourceCurrency}`
  
  let rate: number
  
  if (MOCK_EXCHANGE_RATES[pair]) {
    rate = MOCK_EXCHANGE_RATES[pair]
  } else if (MOCK_EXCHANGE_RATES[reversePair]) {
    rate = 1 / MOCK_EXCHANGE_RATES[reversePair]
  } else if (sourceCurrency === targetCurrency) {
    rate = 1
  } else {
    // Default fallback rate
    rate = 1
  }

  return {
    sourceCurrency,
    targetCurrency,
    rate,
    inverseRate: 1 / rate,
    timestamp: new Date().toISOString(),
    provider: "Chase Foreign Exchange",
  }
}

/**
 * Calculate transfer fees based on amount and corridor
 */
export function calculateTransferFees(
  amount: number,
  sourceCurrency: string,
  targetCurrency: string
): CrossBorderTransferResponse["fees"] {
  // Base wire fee
  const wireFee = 45

  // Correspondent bank fee (charged by intermediary banks)
  let correspondentFee = 0
  if (amount > 10000) {
    correspondentFee = 25
  } else if (amount > 5000) {
    correspondentFee = 15
  }

  // Exchange fee (percentage of amount for FX transactions)
  let exchangeFee = 0
  if (sourceCurrency !== targetCurrency) {
    exchangeFee = Math.min(amount * 0.003, 150) // 0.3% capped at $150
  }

  return {
    wireFee,
    correspondentFee,
    exchangeFee: Math.round(exchangeFee * 100) / 100,
    totalFees: wireFee + correspondentFee + Math.round(exchangeFee * 100) / 100,
  }
}

/**
 * Get estimated arrival time for a transfer corridor
 */
export function getEstimatedArrival(
  sourceCurrency: string,
  targetCurrency: string
): { estimatedDays: string; method: string } {
  const corridor = `${sourceCurrency}-${targetCurrency}`
  return TRANSFER_CORRIDORS[corridor] || TRANSFER_CORRIDORS["default"]
}

/**
 * Validate SWIFT/BIC code format
 */
export function validateSwiftCode(code: string): {
  valid: boolean
  bankCode?: string
  countryCode?: string
  locationCode?: string
  branchCode?: string
  error?: string
} {
  // SWIFT codes are 8 or 11 characters
  // Format: AAAABBCCXXX
  // AAAA - Bank code (letters only)
  // BB - Country code (letters only)
  // CC - Location code (letters or digits)
  // XXX - Branch code (optional, letters or digits)

  const cleanCode = code.toUpperCase().replace(/\s/g, "")

  if (cleanCode.length !== 8 && cleanCode.length !== 11) {
    return {
      valid: false,
      error: "SWIFT code must be 8 or 11 characters",
    }
  }

  const bankCode = cleanCode.substring(0, 4)
  const countryCode = cleanCode.substring(4, 6)
  const locationCode = cleanCode.substring(6, 8)
  const branchCode = cleanCode.length === 11 ? cleanCode.substring(8, 11) : undefined

  // Validate bank code (letters only)
  if (!/^[A-Z]{4}$/.test(bankCode)) {
    return {
      valid: false,
      error: "Invalid bank code in SWIFT (must be 4 letters)",
    }
  }

  // Validate country code (letters only)
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return {
      valid: false,
      error: "Invalid country code in SWIFT (must be 2 letters)",
    }
  }

  return {
    valid: true,
    bankCode,
    countryCode,
    locationCode,
    branchCode,
  }
}

/**
 * Validate IBAN format
 */
export function validateIBAN(iban: string): {
  valid: boolean
  countryCode?: string
  checkDigits?: string
  bankCode?: string
  error?: string
} {
  const cleanIBAN = iban.toUpperCase().replace(/\s/g, "")

  if (cleanIBAN.length < 15 || cleanIBAN.length > 34) {
    return {
      valid: false,
      error: "IBAN must be between 15 and 34 characters",
    }
  }

  const countryCode = cleanIBAN.substring(0, 2)
  const checkDigits = cleanIBAN.substring(2, 4)

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return {
      valid: false,
      error: "Invalid country code in IBAN",
    }
  }

  if (!/^[0-9]{2}$/.test(checkDigits)) {
    return {
      valid: false,
      error: "Invalid check digits in IBAN",
    }
  }

  return {
    valid: true,
    countryCode,
    checkDigits,
    bankCode: cleanIBAN.substring(4, 8),
  }
}

/**
 * Initiate a cross-border wire transfer
 * In production, this would call SWIFT API or a banking partner API
 */
export async function initiateCrossBorderTransfer(
  request: CrossBorderTransferRequest
): Promise<CrossBorderTransferResponse> {
  try {
    // Validate SWIFT code
    const swiftValidation = validateSwiftCode(request.swiftBic)
    if (!swiftValidation.valid) {
      return {
        success: false,
        status: "failed",
        fees: { wireFee: 0, correspondentFee: 0, exchangeFee: 0, totalFees: 0 },
        error: swiftValidation.error,
      }
    }

    // Validate IBAN if provided
    if (request.recipientIBAN) {
      const ibanValidation = validateIBAN(request.recipientIBAN)
      if (!ibanValidation.valid) {
        return {
          success: false,
          status: "failed",
          fees: { wireFee: 0, correspondentFee: 0, exchangeFee: 0, totalFees: 0 },
          error: ibanValidation.error,
        }
      }
    }

    // Calculate fees
    const fees = calculateTransferFees(
      request.amount,
      request.sourceCurrency,
      request.targetCurrency
    )

    // Get exchange rate
    const exchangeInfo = getExchangeRate(request.sourceCurrency, request.targetCurrency)
    const convertedAmount = request.amount * exchangeInfo.rate

    // Get estimated arrival
    const arrivalInfo = getEstimatedArrival(request.sourceCurrency, request.targetCurrency)

    // Generate SWIFT reference (UETR - Unique End-to-end Transaction Reference)
    const swiftReference = generateSwiftReference()

    // Generate transaction ID
    const transactionId = `INTL${Date.now().toString().slice(-10)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // In production, this would:
    // 1. Submit to SWIFT gpi network
    // 2. Run compliance/AML checks
    // 3. Queue for processing

    console.log(`[Cross-Border] Transfer initiated: ${transactionId}`)
    console.log(`[Cross-Border] SWIFT Reference: ${swiftReference}`)
    console.log(`[Cross-Border] Amount: ${request.amount} ${request.sourceCurrency} -> ${convertedAmount.toFixed(2)} ${request.targetCurrency}`)

    return {
      success: true,
      transactionId,
      swiftReference,
      estimatedArrival: arrivalInfo.estimatedDays,
      exchangeRate: exchangeInfo.rate,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      fees,
      status: "initiated",
    }
  } catch (error) {
    console.error("[Cross-Border] Transfer failed:", error)
    return {
      success: false,
      status: "failed",
      fees: { wireFee: 0, correspondentFee: 0, exchangeFee: 0, totalFees: 0 },
      error: error instanceof Error ? error.message : "Transfer initiation failed",
    }
  }
}

/**
 * Generate a SWIFT UETR (Unique End-to-end Transaction Reference)
 * Format: 8-4-4-4-12 hexadecimal UUID
 */
function generateSwiftReference(): string {
  const hex = () => Math.floor(Math.random() * 16).toString(16)
  const segment = (length: number) => Array.from({ length }, hex).join("")
  
  return `${segment(8)}-${segment(4)}-${segment(4)}-${segment(4)}-${segment(12)}`.toUpperCase()
}

/**
 * Get transfer status (for tracking)
 */
export function getTransferStatus(transactionId: string): {
  status: string
  lastUpdate: string
  location?: string
  nextStep?: string
} {
  // In production, this would query SWIFT gpi Tracker
  return {
    status: "Processing",
    lastUpdate: new Date().toISOString(),
    location: "Correspondent Bank",
    nextStep: "Awaiting credit to beneficiary bank",
  }
}

// Real-time payment network types (for documentation)
export type RealTimePaymentNetwork = 
  | "FedNow"      // US Federal Reserve
  | "RTP"         // The Clearing House (US)
  | "SEPA_Inst"   // EU instant payments
  | "Faster"      // UK Faster Payments
  | "PIX"         // Brazil instant payments
  | "UPI"         // India Unified Payments Interface
  | "NPP"         // Australia New Payments Platform
  | "TIPS"        // EU TARGET Instant Payment Settlement

export const REAL_TIME_NETWORKS: Record<string, {
  name: string
  currency: string
  maxAmount: number
  available: string
}> = {
  FedNow: { name: "FedNow Service", currency: "USD", maxAmount: 500000, available: "24/7/365" },
  RTP: { name: "RTP Network", currency: "USD", maxAmount: 1000000, available: "24/7/365" },
  SEPA_Inst: { name: "SEPA Instant", currency: "EUR", maxAmount: 100000, available: "24/7/365" },
  Faster: { name: "Faster Payments", currency: "GBP", maxAmount: 250000, available: "24/7/365" },
  PIX: { name: "PIX", currency: "BRL", maxAmount: 1000000, available: "24/7/365" },
  UPI: { name: "UPI", currency: "INR", maxAmount: 200000, available: "24/7/365" },
}
