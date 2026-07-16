import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm text-center">
          <div className="mb-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Payment Cancelled
          </h1>
          <p className="text-muted-foreground mb-6">
            Your payment has been cancelled. Your card has not been charged.
          </p>

          <div className="space-y-3">
            <Link
              href="/checkout"
              className="block px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:opacity-90 transition"
            >
              Try Again
            </Link>
            <Link
              href="/dashboard"
              className="block px-4 py-2 border border-border text-foreground rounded font-medium hover:bg-muted transition"
            >
              Return to Dashboard
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            If you need assistance, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  )
}
