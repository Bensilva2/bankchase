import Link from 'next/link'
import { PRODUCTS } from '@/lib/stripe-products'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function PaymentOptions() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Banking Services
        </h2>
        <p className="text-muted-foreground">
          Choose a service below to get started with your payment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRODUCTS.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="mb-4">
                <div className="text-3xl font-bold text-foreground">
                  ${(product.priceInCents / 100).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {product.type === 'subscription' ? '/month' : 'one-time'}
                </div>
              </div>
              <Link
                href={`/checkout?productId=${product.id}`}
                className="inline-block"
              >
                <Button className="w-full">
                  {product.type === 'subscription' ? 'Subscribe' : 'Pay Now'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">How it works:</h3>
        <ol className="text-sm text-muted-foreground space-y-2">
          <li>1. Choose a service from the options above</li>
          <li>2. Review the payment details on the checkout page</li>
          <li>3. Enter your payment information securely</li>
          <li>4. Confirm your payment and receive instant confirmation</li>
        </ol>
      </div>
    </div>
  )
}
