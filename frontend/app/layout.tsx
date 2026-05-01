import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BankChase - Workflow Dashboard',
  description: 'Manage your banking workflows and transactions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
                <h1 className="text-xl font-bold text-slate-900">BankChase</h1>
              </div>
              <div className="flex items-center gap-4">
                <a href="/workflows" className="text-slate-600 hover:text-slate-900">Workflows</a>
                <a href="/account" className="text-slate-600 hover:text-slate-900">Account</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
