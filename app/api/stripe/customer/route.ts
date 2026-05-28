import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, metadata } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      return NextResponse.json(existingCustomers.data[0], { status: 200 })
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name: name || '',
      metadata: metadata || {},
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Stripe customer error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('id')
    const email = request.nextUrl.searchParams.get('email')

    let customer

    if (customerId) {
      customer = await stripe.customers.retrieve(customerId)
    } else if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 })
      customer = customers.data[0] || null
    } else {
      return NextResponse.json(
        { error: 'customerId or email is required' },
        { status: 400 }
      )
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Stripe customer get error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}
