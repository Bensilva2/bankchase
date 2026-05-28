'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();

  const validatePassword = (pwd: string) => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push('at least 8 characters');
    if (!/[a-z]/.test(pwd)) errors.push('a lowercase letter');
    if (!/[A-Z]/.test(pwd)) errors.push('an uppercase letter');
    if (!/[0-9]/.test(pwd)) errors.push('a number');
    return errors;
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    setPasswordErrors(pwd ? validatePassword(pwd) : []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError('Password does not meet requirements');
      return;
    }

    try {
      await register(email, password, firstName, lastName);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

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
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xs">✓</span>
        </div>
        <button className="p-2 hover:bg-muted rounded-full transition">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white px-4 py-8 flex flex-col justify-between">
        <div>
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Create account</h1>
            <p className="text-muted-foreground">Join millions of Chase users</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border-b border-border bg-transparent focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground transition"
                  placeholder="John"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border-b border-border bg-transparent focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground transition"
                  placeholder="Doe"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-b border-border bg-transparent focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground transition"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full px-4 py-3 border-b border-border bg-transparent focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground pr-10 transition"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-3 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {password && (
                <div className="mt-4 space-y-2">
                  {['at least 8 characters', 'a lowercase letter', 'an uppercase letter', 'a number'].map((req) => (
                    <div key={req} className={`text-xs flex items-center gap-2 ${passwordErrors.includes(req) ? 'text-red-600' : 'text-green-600'}`}>
                      <span>{passwordErrors.includes(req) ? '○' : '✓'}</span>
                      <span>Contains {req}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-b border-border bg-transparent focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground transition"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-600 text-xs mt-2">Passwords do not match</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || passwordErrors.length > 0 || !email || !password || password !== confirmPassword}
              className="w-full mt-8 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-3 rounded-lg transition"
              aria-busy={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-3 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground text-center">By signing up, you agree to our Terms of Service and Privacy Policy</p>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-xs text-muted-foreground font-semibold mb-2">DEMO ACCOUNT</p>
            <code className="text-xs text-foreground block space-y-1">
              <div>Email: demo@chase.com</div>
              <div>Password: Demo123!</div>
            </code>
          </div>
        </div>
      </div>

      {/* Mobile Bottom */}
      <div className="bg-white border-t border-border px-4 py-3 flex justify-around text-xs text-muted-foreground">
        <Link href="/login" className="flex flex-col items-center gap-1 p-2 hover:text-foreground transition">
          <span>🔒</span>
          <span>Sign in</span>
        </Link>
        <button className="flex flex-col items-center gap-1 p-2 text-primary">
          <span>✍️</span>
          <span className="text-primary">Sign up</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 hover:text-foreground transition">
          <span>❓</span>
          <span>Help</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 hover:text-foreground transition">
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
