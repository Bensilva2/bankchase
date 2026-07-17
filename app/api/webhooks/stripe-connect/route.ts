import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-client'
import { updateBalanceOnCharge, recordTransaction, createBalanceAlert } from '@/lib/balance-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('[v0] Missing Stripe signature')
      return new Response('Missing signature', { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[v0] Missing webhook secret')
      return new Response('Webhook secret not configured', { status: 500 })
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('[v0] Webhook verified:', event.type)
    } catch (err) {
      console.error('[v0] Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    // Handle different event types
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object
        console.log('[v0] Account updated:', account.id, {
          status: account.requirements?.current_deadline,
          verified: !account.requirements?.currently_due?.length,
        })
        break
      }

      case 'charge.succeeded': {
        const charge = event.data.object
        console.log('[v0] Charge succeeded:', {
          chargeId: charge.id,
          amount: charge.amount,
          currency: charge.currency,
          account: charge.on_behalf_of,
        })
        
        // Update balance if charge is for a connected account
        if (charge.on_behalf_of) {
          const amountInDollars = charge.amount / 100
          try {
            await updateBalanceOnCharge(
              charge.on_behalf_of,
              charge.id,
              amountInDollars,
              'completed'
            )
            console.log('[v0] Balance updated for charge:', charge.id)
          } catch (error) {
            console.error('[v0] Error updating balance for charge:', error)
          }
        }
        break
      }

      case 'charge.failed': {
        const charge = event.data.object
        console.log('[v0] Charge failed:', {
          chargeId: charge.id,
          reason: charge.failure_reason,
        })
        
        // Create alert for failed charge
        if (charge.on_behalf_of) {
          try {
            await createBalanceAlert(
              charge.on_behalf_of,
              'unusual_activity',
              `Charge failed: ${charge.id} (${charge.failure_reason})`
            )
          } catch (error) {
            console.error('[v0] Error creating alert for failed charge:', error)
          }
        }
        break
      }

      case 'payout.created': {
        const payout = event.data.object
        console.log('[v0] Payout created:', {
          payoutId: payout.id,
          amount: payout.amount,
          account: event.account,
        })
        // Create payout record in database
        break
      }

      case 'payout.paid': {
        const payout = event.data.object
        console.log('[v0] Payout paid:', {
          payoutId: payout.id,
          arrivalDate: payout.arrival_date,
        })
        
        // Update balance for payout received
        if (event.account) {
          const amountInDollars = payout.amount / 100
          try {
            await recordTransaction({
              accountId: event.account,
              type: 'payout',
              amount: amountInDollars,
              balanceBefore: 0, // Would need to fetch actual balance
              balanceAfter: 0,
              description: `Payout received: ${payout.id}`,
              relatedId: payout.id,
              status: 'completed',
            })
          } catch (error) {
            console.error('[v0] Error recording payout transaction:', error)
          }
        }
        break
      }

      case 'payout.failed': {
        const payout = event.data.object
        console.log('[v0] Payout failed:', {
          payoutId: payout.id,
          failureCode: payout.failure_code,
        })
        // Update payout status to failed
        break
      }

      case 'transfer.created': {
        const transfer = event.data.object
        console.log('[v0] Transfer created:', {
          transferId: transfer.id,
          amount: transfer.amount,
          destination: transfer.destination,
        })
        // Create transfer record in database
        break
      }

      case 'transfer.updated': {
        const transfer = event.data.object
        console.log('[v0] Transfer updated:', {
          transferId: transfer.id,
          status: transfer.status,
        })
        // Update transfer status in database
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object
        console.log('[v0] Subscription created:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          items: subscription.items.data.length,
        })
        // Create subscription record in database
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('[v0] Subscription updated:', {
          subscriptionId: subscription.id,
          status: subscription.status,
        })
        // Update subscription in database
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('[v0] Subscription deleted:', subscription.id)
        // Mark subscription as deleted in database
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log('[v0] Invoice payment succeeded:', {
          invoiceId: invoice.id,
          amount: invoice.amount_paid,
          subscription: invoice.subscription,
        })
        // Update invoice status
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log('[v0] Invoice payment failed:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
        })
        // Update invoice status and notify customer
        break
      }

      default:
        console.log('[v0] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[v0] Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
