import { PaymentOptions } from '@/components/payment-options'

export default function PaymentsPage() {
  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PaymentOptions />
      </div>
    </main>
  )
}
