'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, LayoutDashboard, Wallet, Send, User, ReceiptText, Bell, Users, CreditCard, FileText, Landmark, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/sign-in');
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Send | Zelle®', href: '/send-money', icon: Send },
    { label: 'Transfer', href: '/transfer', icon: ArrowRightLeft },
    { label: 'Deposit', href: '/deposit', icon: Wallet },
    { label: 'Pay bills', href: '/bill-pay', icon: ReceiptText },
    { label: 'Accounts', href: '/accounts', icon: Wallet },
    { label: 'Transactions', href: '/transactions', icon: ReceiptText },
    { label: 'Cards', href: '/cards', icon: CreditCard },
    { label: 'Team Spend', href: '/team-spend', icon: Users },
    { label: 'Payments', href: '/payments', icon: Send },
    { label: 'Invoicing', href: '/invoicing', icon: FileText },
    { label: 'Accounting', href: '/accounting', icon: Landmark },
    { label: 'Ops / Payroll', href: '/payroll', icon: Users },
    { label: 'Notifications', href: '/settings/notifications', icon: Bell },
    { label: 'My profile', href: '/settings/my-profile', icon: User },
    { label: 'Company profile', href: '/settings/company-profile', icon: Landmark },
    { label: 'Settings', href: '/settings', icon: User },
  ];

  return (
    <nav className="bg-background shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/accounts" className="flex items-center">
              <span className="text-2xl font-bold text-primary">Banking</span>
              <span className="text-xs text-muted-foreground ml-2">Workspace</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:text-primary hover:bg-muted/50 transition"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="ml-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-primary hover:bg-muted/50"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-muted/50 transition"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full mt-3 px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-muted/50 transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
