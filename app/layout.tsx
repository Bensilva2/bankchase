import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ClerkProvider, Show, SignUpButton, UserButton } from "@clerk/nextjs"
import Link from "next/link"
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
              <ClerkProvider>
                <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-background text-foreground">
                  <div>Banking App</div>
                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Show when="signed-out">
                      <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary">
                        Sign In
                      </Link>
                      <SignUpButton mode="modal">
                        <button className="text-sm font-medium text-primary-foreground bg-primary px-4 py-2 rounded-md hover:opacity-90">
                          Sign Up
                        </button>
                      </SignUpButton>
                    </Show>
                    <Show when="signed-in">
                      <UserButton />
                    </Show>
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
              </ClerkProvider>
            </StatsigWrapper>
          </ThemeProvider>
        </NavigationProvider>
        <Script id="chatbase-widget" strategy="lazyOnload">
          {`(function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="${process.env.NEXT_PUBLIC_CHATBOT_ID}";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();`}
        </Script>
      </body>
    </html>
  )
}
