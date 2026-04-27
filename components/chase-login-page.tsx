"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ChaseLoginPageProps {
  onLogin: () => void
}

export function ChaseLoginPage({ onLogin }: ChaseLoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [useToken, setUseToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username.trim()) {
      setError("Please enter your username")
      return
    }

    if (!password.trim()) {
      setError("Please enter your password")
      return
    }

    setIsLoading(true)

    try {
      await login(username, password)

      if (rememberMe) {
        localStorage.setItem("chase_username", username)
      } else {
        localStorage.removeItem("chase_username")
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in to Chase.",
      })

      router.push("/dashboard")
    } catch (err) {
      setError("The username or password you entered is incorrect. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0052CC] to-[#0a4fa6] flex flex-col items-center justify-center px-4 py-8">
      {/* Mobile Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-6 text-white text-sm">
        <span className="font-semibold">3:06</span>
        <div className="flex gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9h2v2H1V9zm4 0h2v2H5V9zm4 0h2v2H9V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z" />
          </svg>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z" />
          </svg>
        </div>
      </div>

      {/* Logo and Brand */}
      <div className="flex flex-col items-center gap-4 mb-12 mt-8">
        <div className="flex items-center gap-3">
          <span className="text-white text-4xl font-bold tracking-wider">CHASE</span>
          <div className="w-8 h-8 bg-white rounded flex-shrink-0"></div>
        </div>
      </div>

      {/* Login Form Container */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 mb-4">
        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Username Input */}
          <div>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-0 py-3 text-gray-900 placeholder-gray-400 border-b border-gray-300 focus:border-b-2 focus:border-[#0052CC] focus:outline-none transition-colors bg-transparent"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-0 py-3 text-gray-900 placeholder-gray-400 border-b border-gray-300 focus:border-b-2 focus:border-[#0052CC] focus:outline-none transition-colors bg-transparent pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 bottom-3 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm mt-2">{error}</div>
          )}

          {/* Checkboxes Row */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 accent-[#0052CC] cursor-pointer"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useToken}
                onChange={(e) => setUseToken(e.target.checked)}
                className="w-5 h-5 accent-[#0052CC] cursor-pointer"
              />
              <span className="text-sm text-gray-600">Use token</span>
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0052CC] hover:bg-[#003d99] disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors mt-4"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          {/* Forgot Link */}
          <div className="text-center pt-2">
            <a href="#" className="text-[#0052CC] hover:underline text-sm font-medium">
              Forgot username or password?
            </a>
          </div>
        </form>
      </div>

      {/* Footer Links */}
      <div className="flex flex-wrap justify-center gap-4 text-center text-sm text-white mt-4">
        <a href="#" className="hover:underline">Sign up</a>
        <a href="#" className="hover:underline">Open an account</a>
        <a href="#" className="hover:underline">Privacy</a>
        <button className="hover:underline">•••</button>
      </div>

      {/* Footer Text */}
      <div className="text-center text-xs text-white/80 mt-6 max-w-sm">
        <p className="mb-2">🏠 Equal Housing Lender</p>
        <p className="mb-1">Deposit products provided by JPMorgan Chase Bank, N.A. Member FDIC</p>
        <p>Credit cards are issued by Chase Bank, USA, N.A.</p>
        <p className="mt-2">© 2024 JPMorgan Chase &amp; Co.</p>
      </div>
    </div>
  )
}
