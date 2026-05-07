'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ApiClient from '@/lib/api-client';
import Link from 'next/link';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await ApiClient.login(email, password);
      if (response.access_token) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mobile Status Bar */}
      <div className="bg-white px-4 py-2 flex justify-between items-center text-xs text-foreground border-b border-border">
        <span>No SIM</span>
        <span className="font-semibold">5:25 AM</span>
        <span>3% 🔋</span>
      </div>

      {/* Mobile Header */}
      <div className="bg-white px-4 py-4 flex justify-between items-center border-b border-border">
        <div className="flex gap-3">
          <button className="p-2 hover:bg-muted rounded-full transition">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-full transition">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* Chase Logo */}
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">✓</span>
          </div>
        </div>

        <button className="p-2 hover:bg-muted rounded-full transition">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white px-4 py-8 flex flex-col justify-between">
        <div>
          {/* Heading */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Sign in</h1>
            <p className="text-muted-foreground">to your Chase account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              role="alert"
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
            >
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-3"
              >
                Email or user ID
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-b border-border bg-transparent focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground transition"
                placeholder="you@example.com"
                required
                disabled={loading}
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                autoComplete="email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-3"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-b border-border bg-transparent focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground pr-10 transition"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-3 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-3 rounded-lg transition"
              aria-busy={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Forgot Password */}
          <div className="text-center mt-6">
            <Link 
              href="/forgot-password" 
              className="text-primary hover:text-primary/80 text-sm font-medium transition"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="space-y-3 border-t border-border pt-6">
          <p className="text-center text-muted-foreground text-sm">
            Don&apos;t have an account?{' '}
            <Link 
              href="/signup" 
              className="text-primary hover:text-primary/80 font-semibold transition"
            >
              Sign up
            </Link>
          </p>

          {/* Demo Credentials */}
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-xs text-muted-foreground font-semibold mb-2">DEMO CREDENTIALS</p>
            <code className="text-xs text-foreground block space-y-1">
              <div>Email: demo@chase.com</div>
              <div>Password: demo123</div>
            </code>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="bg-white border-t border-border px-4 py-3 flex justify-around text-xs text-muted-foreground">
        <button className="flex flex-col items-center gap-1 p-2 hover:text-foreground transition">
          <span>💬</span>
          <span>Messages</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 hover:text-foreground transition">
          <span>💳</span>
          <span>Cards</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-primary">
          <span>🔒</span>
          <span className="text-primary">Sign In</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 hover:text-foreground transition">
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
