'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session')
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      router.push('/checkout')
      return
    }

    async function fetchOrderDetails() {
      try {
        const response = await fetch(
          `/api/payments/checkout?session_id=${sessionId}`
        )
        if (!response.ok) throw new Error('Failed to fetch order details')
        const data = await response.json()
        setOrderDetails(data)
      } catch (error) {
        console.error('[v0] Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [sessionId, router])

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm text-center">
          <div className="mb-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your payment. Your transaction has been completed
            successfully.
          </p>

          {loading ? (
            <div className="py-4 text-muted-foreground">
              Loading order details...
            </div>
          ) : orderDetails ? (
            <div className="bg-muted rounded-lg p-4 mb-6 text-left">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Session ID:</dt>
                  <dd className="text-foreground font-mono text-xs">
                    {orderDetails.sessionId?.substring(0, 20)}...
                  </dd>
                </div>
                {orderDetails.amountTotal && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Amount:</dt>
                    <dd className="text-foreground font-semibold">
                      ${(orderDetails.amountTotal / 100).toFixed(2)} USD
                    </dd>
                  </div>
                )}
                {orderDetails.paymentIntentId && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Payment ID:</dt>
                    <dd className="text-foreground font-mono text-xs">
                      {orderDetails.paymentIntentId?.substring(0, 20)}...
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status:</dt>
                  <dd className="text-green-600 font-semibold">
                    {orderDetails.paymentStatus}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:opacity-90 transition"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/pay-transfer"
              className="block px-4 py-2 border border-border text-foreground rounded font-medium hover:bg-muted transition"
            >
              Continue with Transfers
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  )
}
