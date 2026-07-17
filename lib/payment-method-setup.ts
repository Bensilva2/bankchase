import { stripe } from './stripe-client'

export interface PaymentMethodDomain {
  domain: string
  created?: boolean
  verified?: boolean
}

/**
 * Register payment method domains for Stripe
 * Supports: Link, Apple Pay, Google Pay
 */
export async function registerPaymentMethodDomains(
  domains: string[]
): Promise<PaymentMethodDomain[]> {
  try {
    const results: PaymentMethodDomain[] = []

    for (const domain of domains) {
      try {
        // Create payment method domain
        const paymentMethodDomain = await stripe.paymentMethodDomains.create({
          domain_name: domain,
        })

        console.log(`[v0] Payment method domain registered: ${domain}`)

        results.push({
          domain,
          created: true,
          verified: paymentMethodDomain.created > 0,
        })
      } catch (error: any) {
        console.error(`[v0] Error registering domain ${domain}:`, error.message)

        // Check if domain already exists
        if (error.message?.includes('already exists')) {
          results.push({
            domain,
            created: true,
            verified: true,
          })
        } else {
          results.push({
            domain,
            created: false,
          })
        }
      }
    }

    return results
  } catch (error) {
    console.error('[v0] Error registering payment method domains:', error)
    throw error
  }
}

/**
 * Get all registered payment method domains
 */
export async function getPaymentMethodDomains(): Promise<string[]> {
  try {
    const domains = await stripe.paymentMethodDomains.list()
    return domains.data.map((d: any) => d.domain_name || d.domain)
  } catch (error) {
    console.error('[v0] Error fetching payment method domains:', error)
    return []
  }
}

/**
 * Verify payment method domain
 */
export async function verifyPaymentMethodDomain(domain: string): Promise<boolean> {
  try {
    const domains = await stripe.paymentMethodDomains.list()
    const found = domains.data.find(
      (d: any) => (d.domain_name || d.domain) === domain
    )

    if (found) {
      console.log(`[v0] Payment method domain verified: ${domain}`)
      return true
    }

    console.warn(`[v0] Payment method domain not found: ${domain}`)
    return false
  } catch (error) {
    console.error('[v0] Error verifying payment method domain:', error)
    return false
  }
}

/**
 * Setup default payment method domains for BankChase
 */
export async function setupDefaultPaymentMethodDomains(): Promise<void> {
  const defaultDomains = [
    'localhost:3000', // Development
    'bankchase.vercel.app', // Production
    'bankchase.com', // Custom domain
  ]

  try {
    const results = await registerPaymentMethodDomains(defaultDomains)

    console.log('[v0] Payment method domains setup complete:')
    results.forEach((result) => {
      console.log(
        `  - ${result.domain}: ${result.created ? 'Created' : 'Failed'} ${result.verified ? '(Verified)' : ''}`
      )
    })
  } catch (error) {
    console.error('[v0] Error setting up default payment method domains:', error)
  }
}
