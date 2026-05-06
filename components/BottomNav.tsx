'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { name: 'Accounts', href: '/accounts', icon: '🏦' },
  { name: 'Pay', href: '/pay-transfer', icon: '💸' },
  { name: 'Plan', href: '/plan-track', icon: '📈' },
  { name: 'Offers', href: '/offers', icon: '🎁' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around py-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <span className="text-3xl mb-1">{item.icon}</span>
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
