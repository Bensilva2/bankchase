import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DemoTransferForm } from '@/components/demo-transfer-form'
import { BulkDemoTransfer } from '@/components/bulk-demo-transfer'
import { DemoTransferHistory } from '@/components/demo-transfer-history'

export const metadata = {
  title: 'Demo Money Transfer - Admin',
  description: 'Manage demo money transfers for users',
}

export default function DemoTransferPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Demo Money Transfers</h1>
              <p className="text-gray-600">Manage virtual funds for testing and onboarding</p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Single Transfer */}
          <div className="lg:col-span-1">
            <DemoTransferForm />
          </div>

          {/* Bulk Transfer */}
          <div className="lg:col-span-1">
            <BulkDemoTransfer />
          </div>

          {/* Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 h-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span><strong>Registered Users:</strong> Demo funds are credited instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span><strong>External Accounts:</strong> Funds appear as pending</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span><strong>Auto-Refund:</strong> Pending funds refund after 7 or 14 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <span><strong>Bulk Transfer:</strong> Send same amount to all users at once</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Transfer History */}
        <DemoTransferHistory />
      </div>
    </main>
  )
}
