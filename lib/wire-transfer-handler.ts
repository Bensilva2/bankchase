/**
 * Wire Transfer Unified Handler
 * Manages real-time verification flow: Form → Review → OTP → COT → Tax → Processing
 */

export interface WireTransferState {
  step: 'form' | 'review' | 'otp' | 'cot' | 'tax' | 'processing' | 'complete' | 'success'
  formData: {
    amount: number
    recipientName: string
    recipientBank: string
    accountNumber: string
    routingNumber: string
    wireType: 'domestic' | 'international'
  }
  verificationCodes: {
    otp: string
    cot: string
    tax: string
  }
  processingStatus: string
  processingProgress: number
  errors: {
    otp?: string
    cot?: string
    tax?: string
  }
}

export interface WireTransferActions {
  validateForm: () => boolean
  proceedToReview: () => void
  proceedToOTP: () => void
  verifyOTP: (code: string) => boolean
  verifyCOT: (code: string) => boolean
  verifyTax: (code: string) => boolean
  initiateTransfer: () => Promise<void>
  resetForm: () => void
}

/**
 * Validates wire transfer form data
 */
export function validateWireTransferForm(data: WireTransferState['formData']): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  if (!data.recipientName || data.recipientName.trim().length < 3) {
    errors.recipientName = 'Recipient name is required'
  }

  if (!data.recipientBank || data.recipientBank.trim().length < 3) {
    errors.recipientBank = 'Recipient bank name is required'
  }

  if (data.wireType === 'domestic') {
    if (!/^\d{9}$/.test(data.routingNumber)) {
      errors.routingNumber = 'Routing number must be 9 digits'
    }
  } else {
    if (data.routingNumber.length < 8) {
      errors.routingNumber = 'SWIFT/BIC code must be at least 8 characters'
    }
  }

  if (data.accountNumber.length < 8) {
    errors.accountNumber = 'Account number must be at least 8 digits'
  }

  if (data.amount <= 0) {
    errors.amount = 'Amount must be greater than 0'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Formats verification code input to remove spaces
 */
export function formatVerificationCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase()
}

/**
 * Checks if verification code is valid format
 */
export function isValidVerificationCode(code: string): boolean {
  const formattedCode = formatVerificationCode(code)
  return formattedCode.length === 6 && /^\d{6}$/.test(formattedCode)
}

/**
 * Creates processing status steps
 */
export function getProcessingSteps(): Array<{ step: number; message: string; duration: number }> {
  return [
    { step: 1, message: 'Validating wire transfer details...', duration: 2000 },
    { step: 2, message: 'Checking recipient account...', duration: 2000 },
    { step: 3, message: 'Verifying funds availability...', duration: 2000 },
    { step: 4, message: 'Processing payment instructions...', duration: 2000 },
    { step: 5, message: 'Submitting to clearing house...', duration: 2000 },
    { step: 6, message: 'Wire transfer complete!', duration: 1000 },
  ]
}

/**
 * Calculates processing progress
 */
export function calculateProcessingProgress(currentStep: number, totalSteps: number): number {
  const baseProgress = (currentStep / totalSteps) * 100
  const jitterRange = 5
  const jitter = Math.random() * jitterRange
  return Math.min(baseProgress + jitter, 99)
}

/**
 * Real-time step transition with validation
 */
export function getNextStep(
  currentStep: WireTransferState['step'],
  isValid: boolean
): WireTransferState['step'] {
  if (!isValid) return currentStep

  const stepFlow: Record<WireTransferState['step'], WireTransferState['step']> = {
    form: 'review',
    review: 'otp',
    otp: 'cot',
    cot: 'tax',
    tax: 'processing',
    processing: 'complete',
    complete: 'success',
    success: 'success',
  }

  return stepFlow[currentStep] || currentStep
}

/**
 * Simulates real-time wire transfer processing
 */
export async function processWireTransferAsync(
  onProgress: (progress: number, status: string) => void
): Promise<string> {
  const steps = getProcessingSteps()
  const confirmationNumber = `WIR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    onProgress(calculateProcessingProgress(i + 1, steps.length), step.message)
    await new Promise((resolve) => setTimeout(resolve, step.duration))
  }

  onProgress(100, 'Wire transfer completed successfully!')
  return confirmationNumber
}
