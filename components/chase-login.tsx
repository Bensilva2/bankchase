"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface ChaseLoginProps {
  onLogin: () => void
}

export function ChaseLogin({ onLogin }: ChaseLoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [useToken, setUseToken] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await login(username, password)
      onLogin()
      router.push("/")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid username or password"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-700 to-blue-600 flex flex-col">
      {/* Mobile Status Bar */}
      <div className="bg-blue-800 text-white px-4 py-2 flex justify-between items-center text-xs">
        <span className="font-semibold">3:06</span>
        <div className="flex gap-1">
          <span>🔋</span>
          <span>📶</span>
          <span>📡</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Chase Logo */}
        <div className="mb-24 text-center">
          <div className="text-white text-5xl font-bold tracking-wider">
            CHASE
          </div>
          <div className="text-white text-3xl mt-1">⬜</div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-sm bg-white rounded-lg p-8 shadow-lg">
          <form onSubmit={handleSignIn} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="text-gray-600 text-sm mb-2 block">
                Enter your username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="marie102173"
                className="w-full px-0 py-2 border-b border-gray-300 focus:outline-none focus:border-blue-600 bg-transparent text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="text-gray-600 text-sm mb-2 block">
                Enter your password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-0 py-2 border-b border-gray-300 focus:outline-none focus:border-blue-600 bg-transparent text-gray-800 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            {/* Checkboxes */}
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
                <span className="text-gray-600 text-sm">Remember me</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useToken}
                  onChange={(e) => setUseToken(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
                <span className="text-gray-600 text-sm">Use token</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded text-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            {/* Forgot Link */}
            <div className="text-center">
              <a href="#" className="text-blue-600 hover:underline text-sm font-semibold">
                Forgot username or password?
              </a>
            </div>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200"></div>

          {/* Footer Links - Centered Horizontally */}
          <div className="flex items-center justify-center gap-1 text-sm mb-4">
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Sign up
            </a>
            <span className="text-gray-400">|</span>
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Open an account
            </a>
            <span className="text-gray-400">|</span>
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Privacy
            </a>
            <span className="text-gray-400">|</span>
            <button className="text-blue-600 hover:underline font-medium">
              •••
            </button>
          </div>
        </div>

        {/* Legal Footer - Bottom */}
        <div className="text-center text-xs text-gray-700 mt-12 max-w-sm">
          <p className="mb-2">🏘️ Equal Housing Lender</p>
          <p className="text-gray-600">
            Deposit products provided by JPMorgan Chase Bank, N.A. Member FDIC
          </p>
          <p className="text-gray-600 mt-2">
            Credit cards are issued by JPMorgan Chase Bank, N.A.
          </p>
          <p className="text-gray-600 mt-2">© 2021 JPMorgan Chase & Co.</p>
        </div>
      </div>
    </div>
  )
}
