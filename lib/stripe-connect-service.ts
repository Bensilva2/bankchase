import { stripe } from './stripe-client'
import type {
  ConnectedAccount,
  MarketplaceProduct,
  PlatformCharge,
  BankTransfer,
  Payout,
  Transfer,
} from './stripe-connect-types'

// Connected Account Management
export async function createConnectedAccount(
  email: string,
  businessName: string,
  userId: string,
  commissionRate: number = 2.5
): Promise<ConnectedAccount> {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_profile: {
        name: businessName,
        mcc: '6211', // Securities Brokers/Dealers
        support_phone: '+1234567890',
        support_url: 'https://bankchase.local/support',
        url: 'https://bankchase.local',
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        platform_payments: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'daily',
          },
        },
      },
    })

    console.log('[v0] Connected account created:', account.id)

    return {
      id: `ca_${Date.now()}`,
      stripeAccountId: account.id,
      userId,
      email,
      businessName,
      accountStatus: 'pending',
      verificationStatus: 'pending',
      commissionRate,
      totalEarnings: 0,
      totalPayouts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error('[v0] Error creating connected account:', error)
    throw error
  }
}

export async function getConnectedAccount(stripeAccountId: string): Promise<any> {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId)
    console.log('[v0] Retrieved connected account:', stripeAccountId)
    return account
  } catch (error) {
    console.error('[v0] Error retrieving account:', error)
    throw error
  }
}

export async function createAccountLink(
  stripeAccountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string> {
  try {
    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      type: 'account_onboarding',
      refresh_url: refreshUrl,
      return_url: returnUrl,
    })

    console.log('[v0] Account link created:', link.url)
    return link.url
  } catch (error) {
    console.error('[v0] Error creating account link:', error)
    throw error
  }
}

// Product Management
export async function createMarketplaceProduct(
  connectedAccountId: string,
  name: string,
  description: string,
  priceInCents: number,
  currency: string = 'usd'
): Promise<MarketplaceProduct> {
  try {
    const product = await stripe.products.create(
      {
        name,
        description,
        active: true,
      },
      {
        stripeAccount: connectedAccountId,
      }
    )

    const price = await stripe.prices.create(
      {
        product: product.id,
        unit_amount: priceInCents,
        currency,
      },
      {
        stripeAccount: connectedAccountId,
      }
    )

    console.log('[v0] Marketplace product created:', product.id)

    return {
      id: `mp_${Date.now()}`,
      stripeProductId: product.id,
      connectedAccountId,
      name,
      description,
      priceInCents,
      currency,
      images: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error('[v0] Error creating product:', error)
    throw error
  }
}

// Payment Processing with Platform Fees
export async function createPlatformCharge(
  connectedAccountId: string,
  amountInCents: number,
  platformCommissionPercent: number,
  currency: string = 'usd',
  description: string = 'Platform charge'
): Promise<PlatformCharge> {
  try {
    const platformFeeInCents = Math.round((amountInCents * platformCommissionPercent) / 100)
    const connectedAccountFeeInCents = amountInCents - platformFeeInCents

    const charge = await stripe.charges.create({
      amount: amountInCents,
      currency,
      source: 'tok_visa', // In production, use actual token
      description,
      application_fee_amount: platformFeeInCents,
      on_behalf_of: connectedAccountId,
      transfer_data: {
        destination: connectedAccountId,
      },
    })

    console.log('[v0] Platform charge created:', charge.id)

    return {
      id: `pc_${Date.now()}`,
      chargeId: charge.id,
      connectedAccountId,
      amount: amountInCents,
      currency,
      status: charge.status as any,
      customerEmail: charge.billing_details?.email || 'unknown',
      description,
      platformFeeInCents,
      connectedAccountFeeInCents,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error('[v0] Error creating platform charge:', error)
    throw error
  }
}

// Bank Transfer
export async function createBankTransfer(
  connectedAccountId: string,
  amountInCents: number,
  bankAccountId: string,
  currency: string = 'usd'
): Promise<BankTransfer> {
  try {
    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency,
      destination: connectedAccountId,
      description: 'Bank transfer via platform',
    })

    console.log('[v0] Bank transfer created:', transfer.id)

    return {
      id: `bt_${Date.now()}`,
      transferId: transfer.id,
      connectedAccountId,
      amount: amountInCents,
      currency,
      status: transfer.status as any,
      bankAccountId,
      description: 'Bank transfer via platform',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error('[v0] Error creating bank transfer:', error)
    throw error
  }
}

// Payouts
export async function initiatePayout(
  connectedAccountId: string,
  amountInCents: number,
  currency: string = 'usd'
): Promise<Payout> {
  try {
    const payout = await stripe.payouts.create(
      {
        amount: amountInCents,
        currency,
        statement_descriptor: 'BankChase Payout',
      },
      {
        stripeAccount: connectedAccountId,
      }
    )

    console.log('[v0] Payout created:', payout.id)

    const arrivalDate = new Date()
    arrivalDate.setDate(arrivalDate.getDate() + 2) // 2 days for standard payout

    return {
      id: `po_${Date.now()}`,
      payoutId: payout.id,
      connectedAccountId,
      amount: amountInCents,
      currency,
      status: payout.status as any,
      automatedSchedule: true,
      arrivalDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error('[v0] Error creating payout:', error)
    throw error
  }
}

// Transfers between accounts
export async function createTransferBetweenAccounts(
  fromAccountId: string,
  toAccountId: string,
  amountInCents: number,
  reason: string = 'Account transfer',
  currency: string = 'usd'
): Promise<Transfer> {
  try {
    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency,
      destination: toAccountId,
      source_transaction: fromAccountId,
      description: reason,
    })

    console.log('[v0] Transfer between accounts created:', transfer.id)

    return {
      id: `tf_${Date.now()}`,
      transferId: transfer.id,
      fromAccountId,
      toAccountId,
      amount: amountInCents,
      currency,
      status: transfer.status as any,
      reason,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error('[v0] Error creating transfer:', error)
    throw error
  }
}

// Retrieve account balance
export async function getAccountBalance(connectedAccountId: string): Promise<any> {
  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: connectedAccountId,
    })
    console.log('[v0] Retrieved account balance:', connectedAccountId)
    return balance
  } catch (error) {
    console.error('[v0] Error retrieving balance:', error)
    throw error
  }
}

// Retrieve payouts
export async function getAccountPayouts(
  connectedAccountId: string,
  limit: number = 10
): Promise<any> {
  try {
    const payouts = await stripe.payouts.list(
      { limit },
      {
        stripeAccount: connectedAccountId,
      }
    )
    console.log('[v0] Retrieved payouts:', connectedAccountId)
    return payouts
  } catch (error) {
    console.error('[v0] Error retrieving payouts:', error)
    throw error
  }
}

// Retrieve transfers
export async function getAccountTransfers(
  connectedAccountId: string,
  limit: number = 10
): Promise<any> {
  try {
    const transfers = await stripe.transfers.list({
      limit,
      destination: connectedAccountId,
    })
    console.log('[v0] Retrieved transfers:', connectedAccountId)
    return transfers
  } catch (error) {
    console.error('[v0] Error retrieving transfers:', error)
    throw error
  }
}
