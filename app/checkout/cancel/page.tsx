'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-yellow-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-600 mb-6">
            Your payment was not completed. Your account has not been charged.
          </p>

          <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">What happened?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>You cancelled the payment process</li>
              <li>No charges have been made to your account</li>
              <li>You can try again at any time</li>
              <li>Your account remains active with current features</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/pricing"
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition"
            >
              View Plans
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Have questions? Contact our support team at support@chase.com
          </p>
        </div>
      </div>
    </div>
  );
}
