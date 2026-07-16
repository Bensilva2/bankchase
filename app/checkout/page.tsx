'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { StripeCheckout } from '@/components/stripe-checkout'
import { PRODUCTS } from '@/lib/stripe-products'

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const productId = searchParams.get('productId') || 'instant-transfer'
  const [isProcessing, setIsProcessing] = useState(false)

  const product = PRODUCTS.find((p) => p.id === productId)

  const handleSuccess = (sessionId?: string) => {
    setIsProcessing(true)
    setTimeout(() => {
      router.push(`/checkout/success?session=${sessionId || sessionId}`)
    }, 500)
  }

  const handleError = (error: string) => {
    console.error('[v0] Checkout error:', error)
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Payment
          </h1>
          <p className="text-muted-foreground">
            {product
              ? `${product.name} - $${(product.priceInCents / 100).toFixed(2)}`
              : 'Processing your payment'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <StripeCheckout
            productId={productId}
            mode={product?.type === 'subscription' ? 'subscription' : 'payment'}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">
            Payment Details
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Product: {product?.name}</li>
            <li>
              Amount: ${(product?.priceInCents ? product.priceInCents / 100 : 0).toFixed(2)}
            </li>
            <li>
              Type:{' '}
              {product?.type === 'subscription'
                ? 'Monthly Subscription'
                : 'One-time Payment'}
            </li>
            <li>Currency: USD</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
