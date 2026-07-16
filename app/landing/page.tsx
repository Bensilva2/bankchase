'use client'

import { Navigation } from '@/components/Navigation'
import { LandingFeatures } from '@/components/landing-features'
import { BankingFeatures } from '@/components/features-section'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/')
    }
  }, [userId, isLoaded, router])

  if (!isLoaded) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 sm:pt-32 sm:pb-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Banking Reimagined
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Modern banking without the complexity. Send money instantly, manage cards with ease, and control your finances with real-time notifications.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <button className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/login">
              <button className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition">
                Sign In <span aria-hidden="true">→</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <LandingFeatures />

      {/* Advanced Features Section */}
      <BankingFeatures />

      {/* Benefits Section */}
      <section className="py-24 sm:py-32 bg-card/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-12">
              Why choose BankChase?
            </h2>

            <div className="space-y-6">
              {[
                'Instant money transfers with real-time balance updates',
                'Military-grade security with 256-bit encryption',
                'Zero fees on domestic transfers and basic accounts',
                'Mobile-first design for banking on the go',
                '24/7 customer support with live chat',
                'AI-powered spending insights and budgeting tools',
              ].map((benefit, index) => (
                <div key={index} className="flex gap-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <p className="text-base text-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of users who trust BankChase for their banking needs.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <button className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition">
                Create Account
              </button>
            </Link>
            <Link href="/login">
              <button className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition">
                Already have an account? <span aria-hidden="true">→</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">About</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Cookies</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Social</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Twitter</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">LinkedIn</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">GitHub</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-8">
            <p className="text-center text-muted-foreground text-sm">
              © 2024 BankChase. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
