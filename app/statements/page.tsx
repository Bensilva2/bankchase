'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Download, FileText, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function StatementsPage() {
  const router = useRouter()
  const { userId, isLoaded } = useAuth()
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf')

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userId) {
    router.push('/login')
    return null
  }

  // Mock statements data
  const statements = [
    {
      id: '1',
      month: 'December',
      year: 2024,
      date: '2025-01-15',
      account: 'CHASE CHECKING - 4521',
    },
    {
      id: '2',
      month: 'November',
      year: 2024,
      date: '2024-12-15',
      account: 'CHASE CHECKING - 4521',
    },
    {
      id: '3',
      month: 'October',
      year: 2024,
      date: '2024-11-15',
      account: 'CHASE CHECKING - 4521',
    },
    {
      id: '4',
      month: 'September',
      year: 2024,
      date: '2024-10-15',
      account: 'CHASE CHECKING - 4521',
    },
    {
      id: '5',
      month: 'August',
      year: 2024,
      date: '2024-09-15',
      account: 'CHASE CHECKING - 4521',
    },
  ]

  const handleDownload = (statementId: string) => {
    alert(`Downloading statement in ${selectedFormat.toUpperCase()} format...`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card pb-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-background rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Account Statements</h1>
            <p className="text-muted-foreground">Download and view your statements</p>
          </div>
        </div>

        {/* Format Selector */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Download Format</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedFormat('pdf')}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                selectedFormat === 'pdf'
                  ? 'bg-primary text-background'
                  : 'bg-background text-foreground border border-border hover:border-border'
              }`}
            >
              PDF
            </button>
            <button
              onClick={() => setSelectedFormat('csv')}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                selectedFormat === 'csv'
                  ? 'bg-primary text-background'
                  : 'bg-background text-foreground border border-border hover:border-border'
              }`}
            >
              CSV
            </button>
          </div>
        </Card>

        {/* Statements List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Statements</h2>
          {statements.map((statement) => (
            <Card key={statement.id} className="p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-card rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {statement.month} {statement.year}
                    </h3>
                    <p className="text-muted-foreground text-sm">{statement.account}</p>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(statement.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'csv')}
                    className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary"
                  >
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                  </select>
                  <button
                    onClick={() => handleDownload(statement.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary transition"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <Card className="mt-8 p-8 bg-background">
          <h3 className="text-lg font-semibold text-foreground mb-4">About Statements</h3>
          <ul className="space-y-2 text-foreground">
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>Statements are typically available 10 days after the end of your statement period.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>You can download statements in PDF or CSV format for easy record-keeping.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>Statements are available for up to 7 years from your account opening date.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-600 font-bold">•</span>
              <span>For paper statements, call 1-800-935-9935 or contact your branch.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
