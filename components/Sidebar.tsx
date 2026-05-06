'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { name: 'Accounts', href: '/accounts', icon: '🏦' },
  { name: 'Pay & Transfer', href: '/pay-transfer', icon: '💸' },
  { name: 'Plan & Track', href: '/plan-track', icon: '📈' },
  { name: 'Offers', href: '/offers', icon: '🎁' },
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex w-72 flex-col bg-white border-r border-gray-200 h-screen p-6 fixed left-0 top-0 overflow-y-auto">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">C</div>
        <div>
          <h1 className="text-2xl font-bold">Chase</h1>
          <p className="text-xs text-gray-500 -mt-1">Banking</p>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[15px] font-medium transition-all ${
                isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="pt-6 border-t border-gray-200">
        <button className="w-full px-5 py-3 rounded-2xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition">
          Sign Out
        </button>
      </div>
    </div>
  )
}
