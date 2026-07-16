import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "@/components/ui/toaster"
import { BankingProvider } from "@/lib/banking-context"
import { Auth0Provider } from "@/lib/auth0-context"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { LoadingProgressBar } from "@/components/loading-progress-bar"
import StatsigWrapper from "./statsig-provider"
import { NavigationProvider } from "./navigation-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Banking Dashboard",
  description: "Your personal banking dashboard",
  generator: "v0.app",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {(process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview") && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script
            data-recording-token={process.env.METICULOUS_RECORDING_TOKEN}
            data-is-production-environment="false"
            src="https://snippet.meticulous.ai/v1/meticulous.js"
          />
        )}
      </head>
      <body className={`font-sans antialiased`}>
        <LoadingProgressBar />
        <NavigationProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <StatsigWrapper>
              <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-background text-foreground">
                <div>Banking App</div>
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                </div>
              </header>
              <AuthProvider>
                <Auth0Provider>
                  <BankingProvider>
                    {children}
                    <Toaster />
                    <Analytics />
                    <SpeedInsights />
                  </BankingProvider>
                </Auth0Provider>
              </AuthProvider>
            </StatsigWrapper>
          </ThemeProvider>
        </NavigationProvider>
      </body>
    </html>
  )
}
