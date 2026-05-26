import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { BankingProvider } from "@/lib/banking-context"
import { AuthProvider } from "@/lib/auth-context"
import { ErrorBoundary } from "@/components/error-boundary"
import Sidebar from "@/components/Sidebar"
import BottomNav from "@/components/BottomNav"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Chase Banking - Modern Banking Made Simple",
  description: "Manage your accounts, transfers, and transactions with Chase Banking. Secure, fast, and easy to use.",
  generator: "v0.app",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Chase Banking",
    description: "Your modern banking experience",
    type: "website",
    images: [
      {
        url: "/api/og?title=Chase+Banking&description=Your+modern+banking+experience",
        width: 1200,
        height: 630,
        alt: "Chase Banking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chase Banking",
    description: "Your modern banking experience",
    images: ["/api/og?title=Chase+Banking&description=Your+modern+banking+experience"],
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased bg-gray-50`}>
        <ErrorBoundary>
          <AuthProvider>
            <BankingProvider>
              <div className="flex h-screen md:ml-72">
                <Sidebar />
                <main className="flex-1 overflow-auto pb-24 md:pb-0">
                  <div className="max-w-7xl mx-auto p-4 md:p-8">
                    {children}
                  </div>
                </main>
              </div>
              <BottomNav />
              <Toaster />
              <Analytics />
            </BankingProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
