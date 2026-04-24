'use client'

import { useRouter } from 'next/navigation'
import BankingDashboard from '@/app/page'

export default function DashboardPage() {
  const router = useRouter()

  // The main BankingDashboard component handles auth checks
  // This page exists to provide the /dashboard route
  return <BankingDashboard />
}
