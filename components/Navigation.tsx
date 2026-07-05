'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ApiClient from '@/lib/api-client';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await ApiClient.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('access_token');
      router.push('/login');
    }
  };

  const navItems = [
    { label: 'Accounts', href: '/accounts' },
    { label: 'Transfers', href: '/pay-transfer' },
    { label: 'Voice Agent', href: '/voice-agent' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Profile', href: '/profile' },
    { label: 'Privacy & Security', href: '/privacy-security' },
    { label: 'WiFi Security', href: '/wifi-security' },
  ];

  return (
    <nav className="bg-background shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/accounts" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">Chase</span>
              <span className="text-xs text-muted-foreground ml-2">Voice Banking</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:text-blue-600 hover:bg-background transition"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 rounded-lg text-sm font-medium text-background bg-primary hover:bg-primary transition"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-blue-600 hover:bg-background"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-blue-600 hover:bg-background"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-background bg-primary hover:bg-primary mt-4"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
